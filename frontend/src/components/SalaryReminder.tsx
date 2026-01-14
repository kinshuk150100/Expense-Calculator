'use client';

import { useState, useEffect } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import FormInput from './ui/FormInput';
import { getSalaryReminder, setSalaryReminder, deleteSalaryReminder } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import ConfirmModal from './ui/ConfirmModal';

interface SalaryReminderData {
  id: string;
  salaryDate: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Calculate days remaining until next salary date
 * @param salaryDay - Day of month (1-31) when salary is credited
 * @returns Number of days remaining, or null if invalid
 */
function calculateDaysRemaining(salaryDay: number): number | null {
  if (salaryDay < 1 || salaryDay > 31) return null;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  // Calculate next salary date
  let nextSalaryDate = new Date(currentYear, currentMonth, salaryDay);

  // If salary day has passed this month, move to next month
  if (salaryDay < currentDay) {
    nextSalaryDate = new Date(currentYear, currentMonth + 1, salaryDay);
  }

  // Handle edge case: if salary day is 31 and next month has fewer days
  if (salaryDay === 31 && nextSalaryDate.getDate() !== 31) {
    // Move to last day of the month
    nextSalaryDate = new Date(currentYear, currentMonth + 1, 0);
  }

  // Calculate difference in days
  const diffTime = nextSalaryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 0 ? diffDays : null;
}

/**
 * SalaryReminder Component
 * 
 * Displays salary reminder with days remaining until next salary
 * Allows users to set, edit, or delete their salary date
 */
export default function SalaryReminder() {
  const { isAuthenticated } = useAuth();
  const [reminder, setReminder] = useState<SalaryReminderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [salaryDate, setSalaryDate] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load salary reminder on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const loadReminder = async () => {
      try {
        const data = await getSalaryReminder();
        setReminder(data);
        if (data) {
          setSalaryDate(data.salaryDate.toString());
        }
      } catch (error) {
        console.error('Error loading salary reminder:', error);
        // Don't show toast for initial load failure
      } finally {
        setIsLoading(false);
      }
    };

    loadReminder();
  }, [isAuthenticated]);

  const daysRemaining = reminder ? calculateDaysRemaining(reminder.salaryDate) : null;

  const handleSave = async () => {
    const day = parseInt(salaryDate, 10);
    
    if (isNaN(day) || day < 1 || day > 31) {
      toast.error('Please enter a valid day (1-31)');
      return;
    }

    setIsSaving(true);
    try {
      const data = await setSalaryReminder(day);
      setReminder(data);
      setIsEditing(false);
      toast.success('Salary reminder updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update salary reminder';
      toast.error(errorMessage);
      console.error('Error saving salary reminder:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteSalaryReminder();
      // Always clear the state, even if reminder was already deleted
      setReminder(null);
      setSalaryDate('');
      setIsEditing(false);
      setShowDeleteModal(false);
      toast.success('Salary reminder deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete salary reminder';
      toast.error(errorMessage);
      console.error('Error deleting salary reminder:', error);
      // Even on error, clear the state if it exists (optimistic update)
      if (reminder) {
        setReminder(null);
        setSalaryDate('');
        setIsEditing(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleCancel = () => {
    if (reminder) {
      setSalaryDate(reminder.salaryDate.toString());
    } else {
      setSalaryDate('');
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card title="Salary Reminder">
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Salary Reminder">
      {!reminder && !isEditing ? (
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Set your salary date to track how many days are left until your next salary.
          </p>
          <Button
            variant="primary"
            onClick={() => setIsEditing(true)}
            className="w-full"
          >
            Set Salary Date
          </Button>
        </div>
      ) : isEditing ? (
        <div className="space-y-4">
          <div>
            <FormInput
              label="Salary Date (Day of Month)"
              type="number"
              min="1"
              max="31"
              value={salaryDate}
              onChange={(e) => setSalaryDate(e.target.value)}
              placeholder="Enter day (1-31)"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the day of the month when your salary is credited (e.g., 1 for 1st, 15 for 15th)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!salaryDate || isSaving}
              className="flex-1"
            >
              {reminder ? 'Update' : 'Save'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : reminder ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Salary Date</span>
              <span className="text-lg font-bold text-blue-700">
                {reminder.salaryDate}
                {reminder.salaryDate === 1 || reminder.salaryDate === 21 || reminder.salaryDate === 31
                  ? 'st'
                  : reminder.salaryDate === 2 || reminder.salaryDate === 22
                  ? 'nd'
                  : reminder.salaryDate === 3 || reminder.salaryDate === 23
                  ? 'rd'
                  : 'th'}
              </span>
            </div>
            {daysRemaining !== null && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Days Remaining</span>
                  <span className={`text-2xl font-bold ${
                    daysRemaining <= 3 ? 'text-red-600' : daysRemaining <= 7 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {daysRemaining}
                  </span>
                </div>
                {daysRemaining === 0 && (
                  <p className="mt-2 text-sm text-center font-semibold text-green-700">
                    🎉 Salary is credited today!
                  </p>
                )}
                {daysRemaining === 1 && (
                  <p className="mt-2 text-sm text-center font-semibold text-orange-700">
                    ⏰ Salary is tomorrow!
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => setIsEditing(true)}
              className="flex-1"
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteClick}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Salary Reminder"
        message="Are you sure you want to delete your salary reminder? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />
    </Card>
  );
}

