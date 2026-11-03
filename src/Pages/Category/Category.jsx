import React, { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "../../api/api";
import "./Category.css";

const CATEGORY_API = `${API_URL}/api/categories`;

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${CATEGORY_API}/list`);

      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Fetch categories error:", error);
      setMessage("Unable to load categories. Check backend server.");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setName("");
    setImage("");
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setMessage("Please enter category name.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      let response;

      if (editingId) {
        response = await axios.put(
          `${CATEGORY_API}/update/${editingId}`,
          {
            name: name.trim(),
            image: image.trim(),
          }
        );
      } else {
        response = await axios.post(`${CATEGORY_API}/add`, {
          name: name.trim(),
          image: image.trim(),
        });
      }

      if (response.data.success) {
        setMessage(response.data.message);
        resetForm();
        await fetchCategories();
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to save category."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category._id);
    setName(category.name);
    setImage(category.image || "");
    setMessage("");
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) return;

    try {
      const response = await axios.delete(
        `${CATEGORY_API}/remove/${id}`
      );

      if (response.data.success) {
        setMessage(response.data.message);
        await fetchCategories();
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to delete category."
      );
    }
  };

  return (
    <div className="category-page">
      <div className="category-page-header">
        <div>
          <h2>Category Management</h2>
          <p>Add and manage your Nile product categories.</p>
        </div>
      </div>

      <form className="category-form" onSubmit={handleSubmit}>
        <div className="category-form-field">
          <label>Category Name</label>

          <input
            type="text"
            placeholder="Example: Handmade Candles"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <div className="category-form-field">
          <label>Category Image URL (Optional)</label>

          <input
            type="text"
            placeholder="Enter image URL"
            value={image}
            onChange={(event) => setImage(event.target.value)}
          />
        </div>

        <div className="category-form-actions">
          <button type="submit" disabled={loading}>
            {loading
              ? "Saving..."
              : editingId
                ? "Update Category"
                : "Add Category"}
          </button>

          {editingId && (
            <button
              type="button"
              className="category-cancel-btn"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {message && <p className="category-message">{message}</p>}

      <div className="category-list-container">
        <div className="category-list-heading">
          <h3>All Categories</h3>
          <span>{categories.length} categories</span>
        </div>

        {categories.length === 0 ? (
          <div className="category-empty">
            <p>No categories found. Add your first category.</p>
          </div>
        ) : (
          <div className="category-table">
            <div className="category-table-header">
              <span>Category Name</span>
              <span>Image</span>
              <span>Actions</span>
            </div>

            {categories.map((category) => (
              <div
                className="category-table-row"
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

                <div className="category-row-actions">
                  <button
                    type="button"
                    onClick={() => handleEdit(category)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="category-delete-btn"
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

export default Category;