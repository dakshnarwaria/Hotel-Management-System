"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, UsersRound } from "lucide-react";
import Button from "@/components/Button";
import GuestFormFields, {
  type GuestFormValues,
} from "@/components/GuestFormFields";
import { FormField, SelectField } from "@/components/FormField";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";
import { useApi } from "@/hooks/useApi";
import { formatCurrency, formatDate, floorLabel } from "@/lib/format";
import type { AvailableRoom, Employee, Guest } from "@/lib/types";
import { masterDataConfigs, type FormValues } from "@/components/masterDataConfigs";
import { useToast } from "@/components/Toast";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (bookingId: number) => void;
};

const emptyGuest: GuestFormValues = {
  full_name: "",
  phone: "",
  email: "",
  city: "",
  id_proof: "",
};

function localDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function tomorrow(date: string): string {
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00`);
  parsed.setDate(parsed.getDate() + 1);
  return localDate(parsed);
}

export default function NewBookingModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const request = useApi();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [guestSearch, setGuestSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[] | null>(
    null,
  );
  const [selectedRoom, setSelectedRoom] = useState<AvailableRoom | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [showAllEmployees, setShowAllEmployees] = useState(false);
  const [findingRooms, setFindingRooms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestValues, setGuestValues] = useState<GuestFormValues>({
    ...emptyGuest,
  });
  const [guestErrors, setGuestErrors] = useState<Record<string, string>>({});
  const [savingGuest, setSavingGuest] = useState(false);
  const [employeeError, setEmployeeError] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    async function fetchDropdowns() {
      try {
        const [guestRows, employeeRows] = await Promise.all([
          request<Guest[]>("/api/guests"),
          request<Employee[]>("/api/employees"),
        ]);
        if (!active) return;
        setGuests(guestRows);
        setEmployees(employeeRows);
        const preferred = employeeRows.find(
          (employee) =>
            employee.role === "Receptionist" || employee.role === "Manager",
        );
        setSelectedEmployee((current) =>
          current || (preferred ? String(preferred.emp_id) : ""),
        );
      } catch {
        // useApi displays request errors as toasts.
      }
    }
    void fetchDropdowns();
    return () => {
      active = false;
    };
  }, [open, request]);

  const filteredGuests = useMemo(() => {
    const term = guestSearch.trim().toLowerCase();
    if (!term) return guests;
    return guests.filter(
      (guest) =>
        guest.full_name.toLowerCase().includes(term) ||
        guest.phone.includes(term),
    );
  }, [guestSearch, guests]);

  const visibleEmployees = useMemo(() => {
    if (showAllEmployees) return employees;
    return employees.filter(
      (employee) =>
        employee.role === "Receptionist" || employee.role === "Manager",
    );
  }, [employees, showAllEmployees]);

  function closeModal() {
    if (saving || findingRooms || savingGuest) return;
    setStep(1);
    setGuests([]);
    setEmployees([]);
    setGuestSearch("");
    setSelectedGuest(null);
    setCheckIn("");
    setCheckOut("");
    setGuestCount("1");
    setAvailableRooms(null);
    setSelectedRoom(null);
    setSelectedEmployee("");
    setShowAllEmployees(false);
    setError("");
    onClose();
  }

  function invalidateRoomSearch() {
    if (availableRooms !== null) {
      setAvailableRooms(null);
      setSelectedRoom(null);
      setStep(1);
    }
    setError("");
  }

  async function findRooms(preserveError = false) {
    const validation: string[] = [];
    if (!selectedGuest) validation.push("Select a guest");
    if (!checkIn) validation.push("Check-in date is required");
    if (!checkOut) validation.push("Check-out date is required");
    if (checkIn && checkIn < localDate(new Date())) {
      validation.push("Check-in cannot be in the past");
    }
    if (checkIn && checkOut && checkOut <= checkIn) {
      validation.push("Check-out must be after check-in");
    }
    if (!/^[1-9]\d*$/.test(guestCount)) {
      validation.push("Number of guests must be a positive integer");
    }
    if (validation.length) {
      setError(validation.join(", "));
      return;
    }

    if (!preserveError) setError("");
    setFindingRooms(true);
    setAvailableRooms(null);
    setSelectedRoom(null);
    try {
      const params = new URLSearchParams({
        check_in: checkIn,
        check_out: checkOut,
        guests: guestCount,
      });
      const rooms = await request<AvailableRoom[]>(
        `/api/rooms/available?${params.toString()}`,
      );
      setAvailableRooms(rooms);
      setStep(2);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load available rooms",
      );
    } finally {
      setFindingRooms(false);
    }
  }

  function validateGuest(values: GuestFormValues) {
    const errors = masterDataConfigs.guests.validate(
      values as FormValues,
      false,
    );
    setGuestErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function createGuest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateGuest(guestValues)) return;
    setSavingGuest(true);
    try {
      const newGuest = await request<Guest>(
        "/api/guests",
        {
          method: "POST",
          body: JSON.stringify({
            ...guestValues,
            email: guestValues.email.trim() || null,
            city: guestValues.city.trim() || null,
            id_proof: guestValues.id_proof || null,
          }),
        },
        "Guest added successfully",
      );
      setGuests((current) => [newGuest, ...current]);
      setSelectedGuest(newGuest);
      setGuestSearch(`${newGuest.full_name} (${newGuest.phone})`);
      setGuestValues({ ...emptyGuest });
      setGuestErrors({});
      setGuestModalOpen(false);
    } catch {
      // useApi displays request errors as toasts.
    } finally {
      setSavingGuest(false);
    }
  }

  async function confirmBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGuest || !selectedRoom) {
      setError("Select a guest and an available room");
      setStep(!selectedGuest ? 1 : 2);
      return;
    }
    if (!selectedEmployee) {
      setEmployeeError("Employee is required");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const created = await request<{ booking_id: number }>(
        "/api/bookings",
        {
          method: "POST",
          body: JSON.stringify({
            guest_id: selectedGuest.guest_id,
            room_no: selectedRoom.room_no,
            emp_id: Number(selectedEmployee),
            check_in: checkIn,
            check_out: checkOut,
            no_of_guests: Number(guestCount),
          }),
        },
      );
      toast(`Booking #${created.booking_id} created`, "success");
      setStep(1);
      setGuests([]);
      setEmployees([]);
      setGuestSearch("");
      setSelectedGuest(null);
      setCheckIn("");
      setCheckOut("");
      setGuestCount("1");
      setAvailableRooms(null);
      setSelectedRoom(null);
      setSelectedEmployee("");
      setShowAllEmployees(false);
      onCreated(created.booking_id);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Booking failed";
      setError(message);
      if (
        message.toLowerCase().includes("already booked") ||
        message.toLowerCase().includes("under maintenance")
      ) {
        setStep(2);
        await findRooms(true);
      }
    } finally {
      setSaving(false);
    }
  }

  const employeeOptions = [
    { value: "", label: "Select employee" },
    ...visibleEmployees.map((employee) => ({
      value: String(employee.emp_id),
      label: `${employee.emp_name} · ${employee.role}`,
    })),
  ];
  const nights = selectedRoom?.nights ?? 0;

  return (
    <>
      <Modal
        open={open}
        title="New Booking"
        onClose={() => {
          closeModal();
        }}
      >
        <div className="booking-steps" aria-label="Booking steps">
          {["Stay details", "Choose room", "Confirm"].map((label, index) => (
            <div
              className={`booking-step${step === index + 1 ? " active" : ""}${step > index + 1 ? " complete" : ""}`}
              key={label}
            >
              <span>{index + 1}</span>
              <small>{label}</small>
            </div>
          ))}
        </div>

        {error && (
          <div className="booking-error" role="alert">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="booking-step-content">
            <h3>Stay details</h3>
            <div className="guest-picker">
              <label className="form-field">
                <span className="field-label">Guest <span className="required-mark">*</span></span>
                <span className="search-input guest-search">
                  <Search size={17} aria-hidden />
                  <input
                    value={guestSearch}
                    onChange={(event) => {
                      setGuestSearch(event.target.value);
                      setSelectedGuest(null);
                    }}
                    placeholder="Search by guest name or phone"
                    role="combobox"
                    aria-expanded={filteredGuests.length > 0}
                    aria-controls="guest-suggestions"
                  />
                </span>
              </label>
              {guestSearch && !selectedGuest && filteredGuests.length > 0 && (
                <div
                  className="guest-options"
                  id="guest-suggestions"
                  role="listbox"
                  aria-label="Guests"
                >
                  {filteredGuests.slice(0, 8).map((guest) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      key={guest.guest_id}
                      onClick={() => {
                        setSelectedGuest(guest);
                        setGuestSearch(`${guest.full_name} (${guest.phone})`);
                      }}
                    >
                      <strong>{guest.full_name}</strong>
                      <span>{guest.phone}</span>
                    </button>
                  ))}
                </div>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setGuestValues({ ...emptyGuest });
                  setGuestErrors({});
                  setGuestModalOpen(true);
                }}
              >
                <Plus size={15} />
                New guest
              </Button>
              {selectedGuest && (
                <div className="selected-guest">
                  <UsersRound size={16} />
                  <span>{selectedGuest.full_name} · {selectedGuest.phone}</span>
                </div>
              )}
            </div>
            <div className="booking-fields-grid">
              <FormField
                name="check_in"
                label="Check-in"
                type="date"
                required
                min={localDate(new Date())}
                value={checkIn}
                onChange={(event) => {
                  invalidateRoomSearch();
                  setCheckIn(event.target.value);
                  if (checkOut && event.target.value >= checkOut) {
                    setCheckOut(tomorrow(event.target.value));
                  }
                }}
              />
              <FormField
                name="check_out"
                label="Check-out"
                type="date"
                required
                min={tomorrow(checkIn)}
                value={checkOut}
                onChange={(event) => {
                  invalidateRoomSearch();
                  setCheckOut(event.target.value);
                }}
              />
              <FormField
                name="no_of_guests"
                label="Number of guests"
                type="number"
                min={1}
                step={1}
                required
                value={guestCount}
                onChange={(event) => {
                  invalidateRoomSearch();
                  setGuestCount(event.target.value);
                }}
              />
            </div>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={closeModal} disabled={findingRooms}>
                Cancel
              </Button>
              <Button
                type="button"
                loading={findingRooms}
                onClick={() => void findRooms()}
              >
                Find available rooms
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="booking-step-content">
            <h3>Choose a room</h3>
            <p className="muted">
              {formatDate(checkIn)} to {formatDate(checkOut)} · {guestCount}{" "}
              {Number(guestCount) === 1 ? "guest" : "guests"}
            </p>
            {availableRooms && availableRooms.length === 0 ? (
              <div className="empty-room-state">
                <p>No rooms are available for this stay.</p>
                <span>Try different dates or fewer guests.</span>
              </div>
            ) : (
              <div className="room-card-list">
                {availableRooms?.map((room) => {
                  const selected = selectedRoom?.room_no === room.room_no;
                  return (
                    <button
                      type="button"
                      key={room.room_no}
                      className={`room-choice${selected ? " selected" : ""}`}
                      onClick={() => {
                        setSelectedRoom(room);
                        setError("");
                      }}
                      aria-pressed={selected}
                    >
                      <span className="room-choice-heading">
                        <strong>Room {room.room_no}</strong>
                        <StatusBadge status="Available">Available</StatusBadge>
                      </span>
                      <span className="room-choice-type">{room.type_name}</span>
                      <span className="room-choice-details">
                        Floor {floorLabel(room.floor_no)} · Capacity {room.capacity}
                      </span>
                      <span className="room-choice-details">
                        {formatCurrency(room.price_per_night)} / night · {room.nights}{" "}
                        {room.nights === 1 ? "night" : "nights"}
                      </span>
                      <strong className="room-choice-total">
                        {formatCurrency(room.estimated_total)}
                      </strong>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="form-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="button"
                disabled={!selectedRoom}
                onClick={() => {
                  setStep(3);
                  setError("");
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form
            className="booking-step-content"
            onSubmit={(event) => void confirmBooking(event)}
          >
            <h3>Confirm booking</h3>
            <label className="show-all-employees">
              <input
                type="checkbox"
                checked={showAllEmployees}
                onChange={(event) => {
                  const showAll = event.target.checked;
                  setShowAllEmployees(showAll);
                  if (
                    !showAll &&
                    !employees.some(
                      (employee) =>
                        String(employee.emp_id) === selectedEmployee &&
                        (employee.role === "Receptionist" ||
                          employee.role === "Manager"),
                    )
                  ) {
                    const preferred = employees.find(
                      (employee) =>
                        employee.role === "Receptionist" ||
                        employee.role === "Manager",
                    );
                    setSelectedEmployee(
                      preferred ? String(preferred.emp_id) : "",
                    );
                  }
                  setEmployeeError("");
                }}
              />
              Show all employees
            </label>
            <SelectField
              name="emp_id"
              label="Assigned employee"
              required
              value={selectedEmployee}
              options={employeeOptions}
              error={employeeError}
              onChange={(event) => {
                setSelectedEmployee(event.target.value);
                setEmployeeError("");
              }}
            />
            <div className="booking-summary">
              <span className="eyebrow">Stay summary</span>
              <div><span>Guest</span><strong>{selectedGuest?.full_name}</strong></div>
              <div><span>Room</span><strong>{selectedRoom?.room_no} · {selectedRoom?.type_name}</strong></div>
              <div><span>Dates</span><strong>{formatDate(checkIn)} – {formatDate(checkOut)}</strong></div>
              <div><span>Stay</span><strong>{nights} {nights === 1 ? "night" : "nights"} · {guestCount} {Number(guestCount) === 1 ? "guest" : "guests"}</strong></div>
              <div className="summary-total"><span>Estimated room total</span><strong>{formatCurrency(selectedRoom?.estimated_total ?? 0)}</strong></div>
            </div>
            <div className="form-actions">
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button type="submit" loading={saving}>
                Confirm booking
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={guestModalOpen}
        title="Add Guest"
        onClose={() => {
          if (!savingGuest) setGuestModalOpen(false);
        }}
      >
        <form className="resource-form" onSubmit={(event) => void createGuest(event)} noValidate>
          <GuestFormFields
            values={guestValues}
            errors={guestErrors}
            disabled={savingGuest}
            onChange={(field, value) => {
              setGuestValues((current) => ({ ...current, [field]: value }));
              setGuestErrors((current) => {
                if (!(field in current)) return current;
                const next = { ...current };
                delete next[field];
                return next;
              });
            }}
          />
          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              disabled={savingGuest}
              onClick={() => setGuestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={savingGuest}>Add and select guest</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
