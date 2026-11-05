import React, { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "../../api/api";
import "./ParentCategory.css";

const CATEGORY_API = `${API_URL}/api/categories`;

const ParentCategory = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch parent categories
const fetchParentCategories = async () => {
try {
const response = await axios.get(`${CATEGORY_API}/list`);


if (response.data.success) {
  const allCategories = response.data.data || [];

  const parents = allCategories.filter((category) => {
    return (
      !category.parentCategory ||
      category.parentCategory === null
    );
  });

  setCategories(parents);
}


} catch (error) {
console.error("Fetch parent categories error:", error);
setMessage("Unable to load parent categories.");
}
};


  useEffect(() => {
    fetchParentCategories();
  }, []);

  // Reset form
  const resetForm = () => {
    setName("");
    setImage("");
    setEditingId(null);
  };

  // Add / Update parent category
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setMessage("Please enter parent category name.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      let response;

      const payload = {
        name: name.trim(),
        image: image.trim(),
        parentCategory: null,
      };

      if (editingId) {
        response = await axios.put(
          `${CATEGORY_API}/update/${editingId}`,
          payload
        );
      } else {
        response = await axios.post(
          `${CATEGORY_API}/add`,
          payload
        );
      }

      if (response.data.success) {
        setMessage(response.data.message);
        resetForm();
        await fetchParentCategories();
      }
    } catch (error) {
      console.error("Save parent category error:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to save parent category."
      );
    } finally {
      setLoading(false);
    }
  };

  // Edit category
  const handleEdit = (category) => {
    setEditingId(category._id);
    setName(category.name);
    setImage(category.image || "");
    setMessage("");
  };

  // Delete category
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this parent category?"
    );

    if (!confirmed) return;

    try {
      const response = await axios.delete(
        `${CATEGORY_API}/remove/${id}`
      );

      if (response.data.success) {
        setMessage(response.data.message);
        await fetchParentCategories();
      }
    } catch (error) {
      console.error("Delete parent category error:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to delete parent category."
      );
    }
  };

  return (
    <div className="parent-category-page">

      {/* Header */}
      <div className="parent-category-header">
        <div>
          <h2>Parent Category Management</h2>
          <p>
            Create and manage main product categories.
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        className="parent-category-form"
        onSubmit={handleSubmit}
      >
        <div className="parent-category-field">
          <label>Parent Category Name</label>

          <input
            type="text"
            placeholder="Example: Men, Women, Kids"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <div className="parent-category-field">
          <label>Category Image URL (Optional)</label>

          <input
            type="text"
            placeholder="Enter image URL"
            value={image}
            onChange={(event) => setImage(event.target.value)}
          />
        </div>

        <div className="parent-category-actions">
          <button type="submit" disabled={loading}>
            {loading
              ? "Saving..."
              : editingId
                ? "Update Parent Category"
                : "Add Parent Category"}
          </button>

          {editingId && (
            <button
              type="button"
              className="parent-cancel-btn"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Message */}
      {message && (
        <p className="parent-category-message">
          {message}
        </p>
      )}

      {/* Category List */}
      <div className="parent-category-list">

        <div className="parent-category-list-heading">
          <h3>All Parent Categories</h3>
          <span>{categories.length} categories</span>
        </div>

        {categories.length === 0 ? (
          <div className="parent-category-empty">
            <p>No parent categories found.</p>
            <small>Add your first parent category.</small>
          </div>
        ) : (
          <div className="parent-category-table">

            <div className="parent-category-table-header">
              <span>Category Name</span>
              <span>Image</span>
              <span>Actions</span>
            </div>

            {categories.map((category) => (
              <div
                className="parent-category-table-row"
                key={category._id}
              >
                <span>{category.name}</span>

                <span>
                  {category.image ? (
                    <a
                      href={category.image}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Image
                    </a>
                  ) : (
                    "No image"
                  )}
                </span>

                <div className="parent-category-row-actions">
                  <button
                    type="button"
                    onClick={() => handleEdit(category)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="parent-delete-btn"
                    onClick={() => handleDelete(category._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

          </div>
        )}
      </div>

    </div>
  );
};

export default ParentCategory;