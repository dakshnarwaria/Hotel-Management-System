"use client";

import { FormField, SelectField } from "@/components/FormField";

export type GuestFormValues = {
  full_name: string;
  phone: string;
  email: string;
  city: string;
  id_proof: string;
};

type Props = {
  values: GuestFormValues;
  errors: Record<string, string>;
  disabled?: boolean;
  onChange: (field: keyof GuestFormValues, value: string) => void;
};

const idProofOptions = [
  { value: "", label: "Select an option" },
  { value: "Aadhaar", label: "Aadhaar" },
  { value: "Passport", label: "Passport" },
  { value: "Driving License", label: "Driving License" },
  { value: "Voter ID", label: "Voter ID" },
  { value: "PAN", label: "PAN" },
];

export default function GuestFormFields({
  values,
  errors,
  disabled = false,
  onChange,
}: Props) {
  return (
    <>
      <FormField
        name="full_name"
        label="Full name"
        type="text"
        required
        maxLength={50}
        value={values.full_name}
        error={errors.full_name}
        disabled={disabled}
        onChange={(event) => onChange("full_name", event.target.value)}
      />
      <FormField
        name="phone"
        label="Phone"
        type="tel"
        required
        maxLength={15}
        value={values.phone}
        error={errors.phone}
        disabled={disabled}
        onChange={(event) => onChange("phone", event.target.value)}
      />
      <FormField
        name="email"
        label="Email"
        type="email"
        maxLength={60}
        value={values.email}
        error={errors.email}
        disabled={disabled}
        onChange={(event) => onChange("email", event.target.value)}
      />
      <FormField
        name="city"
        label="City"
        type="text"
        maxLength={30}
        value={values.city}
        error={errors.city}
        disabled={disabled}
        onChange={(event) => onChange("city", event.target.value)}
      />
      <SelectField
        name="id_proof"
        label="ID proof"
        options={idProofOptions}
        value={values.id_proof}
        error={errors.id_proof}
        disabled={disabled}
        onChange={(event) => onChange("id_proof", event.target.value)}
      />
    </>
  );
}
