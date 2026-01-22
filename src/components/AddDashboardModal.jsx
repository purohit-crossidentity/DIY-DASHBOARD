/**
 * Add Dashboard Modal
 *
 * Modal for creating a new dashboard with:
 * - Dashboard name and description
 * - Predefined widgets selection
 */

import { useState, useEffect } from 'react';
import '../styles/AddDashboardModal.css';

const AddDashboardModal = ({ customWidgets, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    dashboardName: '',
    dashboardDesc: '',
    selectedWidgetIds: []
  });

  // Auto-select all widgets (30 defaults) when modal opens
  useEffect(() => {
    if (customWidgets && customWidgets.length > 0) {
      setFormData(prev => ({
        ...prev,
        selectedWidgetIds: customWidgets.map(w => w.id)
      }));
    }
  }, [customWidgets]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle widget toggle
  const handleWidgetToggle = (widgetId) => {
    setFormData(prev => ({
      ...prev,
      selectedWidgetIds: prev.selectedWidgetIds.includes(widgetId)
        ? prev.selectedWidgetIds.filter(id => id !== widgetId)
        : [...prev.selectedWidgetIds, widgetId]
    }));
  };

  // Handle select all widgets
  const handleSelectAllWidgets = (e) => {
    if (e.target.checked) {
      setFormData(prev => ({
        ...prev,
        selectedWidgetIds: customWidgets.map(w => w.id)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedWidgetIds: []
      }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.dashboardName.trim()) {
      newErrors.dashboardName = 'Dashboard name is required';
    }

    if (!formData.dashboardDesc.trim()) {
      newErrors.dashboardDesc = 'Dashboard description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    const result = await onSubmit({
      dashboardName: formData.dashboardName.trim(),
      dashboardDesc: formData.dashboardDesc.trim(),
      customWidgetIds: formData.selectedWidgetIds
    });

    setIsSubmitting(false);

    if (!result.success) {
      setErrors({ submit: result.error });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-dashboard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Dashboard</h2>
          <button className="close-btn" onClick={onClose}>x</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="dashboardName">
              Dashboard Name:<span className="required">*</span>
            </label>
            <input
              type="text"
              id="dashboardName"
              name="dashboardName"
              value={formData.dashboardName}
              onChange={handleChange}
              placeholder="Enter dashboard name"
              className={errors.dashboardName ? 'error' : ''}
            />
            {errors.dashboardName && (
              <span className="error-message">{errors.dashboardName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="dashboardDesc">
              Dashboard Description:<span className="required">*</span>
            </label>
            <input
              type="text"
              id="dashboardDesc"
              name="dashboardDesc"
              value={formData.dashboardDesc}
              onChange={handleChange}
              placeholder="Enter dashboard description"
              className={errors.dashboardDesc ? 'error' : ''}
            />
            {errors.dashboardDesc && (
              <span className="error-message">{errors.dashboardDesc}</span>
            )}
          </div>

          <div className="form-group">
            <label>Choose widgets:</label>
            <div className="widget-list">
              {customWidgets.length === 0 ? (
                <p className="no-widgets">No widgets available. Please configure widgets in the Custom Widgets layer first.</p>
              ) : (
                <>
                  <div className="widget-item select-all-item">
                    <input
                      type="checkbox"
                      checked={customWidgets.length > 0 && formData.selectedWidgetIds.length === customWidgets.length}
                      onChange={handleSelectAllWidgets}
                    />
                    <span className="select-all-label">Select All</span>
                  </div>
                  {customWidgets.map(widget => (
                  <div
                    key={widget.id}
                    className={`widget-item ${formData.selectedWidgetIds.includes(widget.id) ? 'selected' : ''}`}
                    onClick={() => handleWidgetToggle(widget.id)}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedWidgetIds.includes(widget.id)}
                      onChange={() => {}}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWidgetToggle(widget.id);
                      }}
                    />
                    <span>{widget.widget_name}</span>
                  </div>
                ))}
                </>
              )}
            </div>
          </div>

          {errors.submit && (
            <div className="submit-error">{errors.submit}</div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDashboardModal;
