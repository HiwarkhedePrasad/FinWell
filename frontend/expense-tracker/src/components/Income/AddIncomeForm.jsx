import React, { useState } from "react";
import Input from "../Inputs/Input";
import EmojiPickerPopup from "../EmojiPickerPopup";

const AddIncomeForm = ({ onAddIncome }) => {
  const [income, setIncome] = useState({
    source: "",
    amount: "",
    date: "",
    icon: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (key, value) => {
    setIncome({ ...income, [key]: value });
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors({ ...errors, [key]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!income.source.trim()) {
      newErrors.source = "Income source is required";
    }

    if (!income.amount || isNaN(income.amount) || Number(income.amount) <= 0) {
      newErrors.amount = "Amount must be a positive number";
    }

    if (!income.date) {
      newErrors.date = "Date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onAddIncome(income);
      // Reset form on success
      setIncome({
        source: "",
        amount: "",
        date: "",
        icon: "",
      });
      setErrors({});
    } catch (error) {
      console.error("Error adding income:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <EmojiPickerPopup
        icon={income.icon}
        onSelect={(icon) => handleChange("icon", icon)}
      />

      <Input
        value={income.source}
        onChange={({ target }) => handleChange("source", target.value)}
        label="Income Source"
        placeholder="Salary, Freelance etc."
        type="text"
        error={errors.source}
      />

      <Input
        value={income.amount}
        onChange={({ target }) => handleChange("amount", target.value)}
        label="Amount"
        placeholder="$1000"
        type="number"
        error={errors.amount}
      />

      <Input
        value={income.date}
        onChange={({ target }) => handleChange("date", target.value)}
        label="Date"
        placeholder="DD/MM/YYYY"
        type="date"
        error={errors.date}
      />

      <div className="flex justify-end mt-6">
        <button
          type="button"
          className="add-btn add-btn-fill disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Adding..." : "Add Income"}
        </button>
      </div>
    </div>
  );
};

export default AddIncomeForm;
