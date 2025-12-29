/**
 * Add Dashboard Modal
 *
 * Modal for creating a new dashboard with:
 * - Dashboard name and description
 * - Predefined widgets selection
 */

import { useState } from 'react';
import '../styles/AddDashboardModal.css';

const AddDashboardModal = ({ predefinedWidgets, customWidgets, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    dashboardName: '',
    dashboardDesc: '',
    selectedPredefinedWidgets: [],
    customWidgetIds: []
  });
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

  // Handle predefined widget toggle
  const handlePredefinedWidgetToggle = (widgetName) => {
    setFormData(prev => ({
      ...prev,
      selectedPredefinedWidgets: prev.selectedPredefinedWidgets.includes(widgetName)
        ? prev.selectedPredefinedWidgets.filter(name => name !== widgetName)
        : [...prev.selectedPredefinedWidgets, widgetName]
    }));
  };

  // Handle custom widget toggle
  const handleCustomWidgetToggle = (widgetId) => {
    setFormData(prev => ({
      ...prev,
      customWidgetIds: prev.customWidgetIds.includes(widgetId)
        ? prev.customWidgetIds.filter(id => id !== widgetId)
        : [...prev.customWidgetIds, widgetId]
    }));
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
      selectedPredefinedWidgets: formData.selectedPredefinedWidgets,
      customWidgetIds: formData.customWidgetIds
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
              {predefinedWidgets.length === 0 && customWidgets.length === 0 ? (
                <p className="no-widgets">No widgets available</p>
              ) : (
                <>
                  {/* Predefined Widgets */}
                  {predefinedWidgets.map(widgetName => (
                    <div
                      key={widgetName}
                      className={`widget-item ${formData.selectedPredefinedWidgets.includes(widgetName) ? 'selected' : ''}`}
                      onClick={() => handlePredefinedWidgetToggle(widgetName)}
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedPredefinedWidgets.includes(widgetName)}
                        onChange={() => {}}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePredefinedWidgetToggle(widgetName);
                        }}
                      />
                      <span>{widgetName}</span>
                    </div>
                  ))}

                  {/* Custom Widgets */}
                  {customWidgets.map(widget => (
                    <div
                      key={`custom-${widget.id}`}
                      className={`widget-item custom ${formData.customWidgetIds.includes(widget.id) ? 'selected' : ''}`}
                      onClick={() => handleCustomWidgetToggle(widget.id)}
                    >
                      <input
                        type="checkbox"
                        checked={formData.customWidgetIds.includes(widget.id)}
                        onChange={() => {}}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCustomWidgetToggle(widget.id);
                        }}
                      />
                      <span>{widget.widget_name} (Custom)</span>
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
