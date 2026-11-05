import React, { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "../../api/api";
import "./Category.css";

const CATEGORY_API = `${API_URL}/api/categories`;

const Category = () => {
const [categories, setCategories] = useState([]);
const [parentCategories, setParentCategories] = useState([]);

const [name, setName] = useState("");
const [image, setImage] = useState("");
const [parentCategory, setParentCategory] = useState("");

const [editingId, setEditingId] = useState(null);
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");

// FETCH PARENT + SUB CATEGORIES
const fetchCategories = async () => {
try {
const response = await axios.get(`${CATEGORY_API}/list`);


  if (response.data.success) {
    const allCategories = response.data.data || [];

    // Only parent categories
    const parents = allCategories.filter(
      (category) => !category.parentCategory
    );

    // Only subcategories
    const subCategories = allCategories.filter(
      (category) => !!category.parentCategory
    );

    setParentCategories(parents);
    setCategories(subCategories);
  }
} catch (error) {
  console.error("Fetch categories error:", error);
  setMessage("Unable to load categories.");
}


};

useEffect(() => {
fetchCategories();
}, []);

// RESET FORM
const resetForm = () => {
setName("");
setImage("");
setParentCategory("");
setEditingId(null);
};

// ADD / UPDATE CATEGORY
const handleSubmit = async (event) => {
event.preventDefault();


if (!name.trim()) {
  setMessage("Please enter category name.");
  return;
}

if (!parentCategory) {
  setMessage("Please select a parent category.");
  return;
}

setLoading(true);
setMessage("");

try {
  const payload = {
    name: name.trim(),
    image: image.trim(),
    parentCategory: parentCategory,
  };

  let response;

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
    await fetchCategories();
  }
} catch (error) {
  console.error("Save category error:", error);

  setMessage(
    error.response?.data?.message ||
      "Unable to save category."
  );
} finally {
  setLoading(false);
}


};

// GET PARENT CATEGORY NAME
const getParentName = (category) => {
if (category.parentCategory && typeof category.parentCategory === "object") {
return category.parentCategory.name || "Unknown";
}


const parent = parentCategories.find(
  (item) => item._id === category.parentCategory
);

return parent?.name || "Unknown";


};

// EDIT CATEGORY
const handleEdit = (category) => {
setEditingId(category._id);
setName(category.name);
setImage(category.image || "");


const parentId =
  typeof category.parentCategory === "object"
    ? category.parentCategory?._id
    : category.parentCategory;

setParentCategory(parentId || "");
setMessage("");


};

// DELETE CATEGORY
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

return ( <div className="category-page">


  <div className="category-page-header">
    <div>
      <h2>Category Management</h2>
      <p>Add and manage product subcategories.</p>
    </div>
  </div>

  {/* FORM */}
  <form className="category-form" onSubmit={handleSubmit}>

    <div className="category-form-field">
      <label>Parent Category</label>

      <select
        value={parentCategory}
        onChange={(event) =>
          setParentCategory(event.target.value)
        }
        required
      >
        <option value="">Select Parent Category</option>

        {parentCategories.map((parent) => (
          <option key={parent._id} value={parent._id}>
            {parent.name}
          </option>
        ))}
      </select>
    </div>

    <div className="category-form-field">
      <label>Category Name</label>

      <input
        type="text"
        placeholder="Example: Shirts, Jeans, T-Shirts"
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

  {message && (
    <p className="category-message">{message}</p>
  )}

  {/* SUBCATEGORY LIST */}
  <div className="category-list-container">

    <div className="category-list-heading">
      <h3>All Categories</h3>
      <span>{categories.length} categories</span>
    </div>

    {categories.length === 0 ? (
      <div className="category-empty">
        <p>No subcategories found. Add your first category.</p>
      </div>
    ) : (
      <div className="category-table">

        <div className="category-table-header">
          <span>Category Name</span>
          <span>Parent Category</span>
          <span>Image</span>
          <span>Actions</span>
        </div>

        {categories.map((category) => (
          <div
            className="category-table-row"
            key={category._id}
          >
            <span>{category.name}</span>

            <span>{getParentName(category)}</span>

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
