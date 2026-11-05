import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./Add.css";
import API_URL from "../../api/api";
const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const initialData = {
  name: "",
  description: "",
  parentCategory: "",
  category: "",
  marketPrice: "",
  price: "",
  stock: "",
};

const Add = () => {
  const [data, setData] = useState(initialData);
  const [images, setImages] = useState([]);
const [categories, setCategories] = useState([]);
const [parentCategories, setParentCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [popup, setPopup] = useState({
    show: false,
    type: "",
    message: "",
  });

  const popupTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const previewUrlsRef = useRef([]);

  // Fetch categories
  useEffect(() => {
const fetchCategories = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/api/categories/list`
    );

    if (response.data.success) {
      const allCategories = (response.data.data || []).filter(
        (category) => category.isActive !== false
      );

      // Parent categories only
      const parents = allCategories.filter(
        (category) => !category.parentCategory
      );

      setParentCategories(parents);

      // Child categories only
      const children = allCategories.filter(
        (category) => !!category.parentCategory
      );

      setCategories(children);
    }
  } catch (error) {
    console.error("Fetch categories error:", error);
  } finally {
    setCategoriesLoading(false);
  }
};

    fetchCategories();

    return () => {
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }

      previewUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  // Success / Error popup
  const showPopup = (type, message) => {
    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current);
    }

    setPopup({
      show: true,
      type,
      message,
    });

    popupTimerRef.current = setTimeout(() => {
      setPopup({
        show: false,
        type: "",
        message: "",
      });
    }, 4000);
  };

  const closePopup = () => {
    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current);
    }

    setPopup({
      show: false,
      type: "",
      message: "",
    });
  };

  // Input change
  const onChangeHandler = (event) => {
    const { name, value } = event.target;

    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
const onParentCategoryChange = (event) => {
  const parentId = event.target.value;

  setData((prev) => ({
    ...prev,
    parentCategory: parentId,
    category: "",
  }));
};

const filteredCategories = categories.filter((category) => {
  const categoryParentId =
    typeof category.parentCategory === "object"
      ? category.parentCategory?._id
      : category.parentCategory;

  return String(categoryParentId) === String(data.parentCategory);
});
  // Image selection
  const onImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    if (selectedFiles.length > MAX_IMAGES) {
      showPopup(
        "error",
        `You can select a maximum of ${MAX_IMAGES} images at once.`
      );

      event.target.value = "";
      return;
    }

    const invalidFile = selectedFiles.find(
      (file) => !file.type.startsWith("image/")
    );

    if (invalidFile) {
      showPopup("error", "Please select image files only.");
      event.target.value = "";
      return;
    }

    const oversizedFile = selectedFiles.find(
      (file) => file.size > MAX_FILE_SIZE
    );

    if (oversizedFile) {
      showPopup("error", "Each image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setImages((previousImages) => {
      const combinedImages = [...previousImages, ...selectedFiles];

      const uniqueImages = combinedImages.filter(
        (file, index, array) =>
          array.findIndex(
            (item) =>
              item.name === file.name &&
              item.size === file.size &&
              item.lastModified === file.lastModified
          ) === index
      );

      if (uniqueImages.length > MAX_IMAGES) {
        showPopup(
          "error",
          `You can upload a maximum of ${MAX_IMAGES} images in total.`
        );

        return previousImages;
      }

      return uniqueImages;
    });

    event.target.value = "";
  };

  // Remove selected image
  const removeImage = (indexToRemove) => {
    setImages((previousImages) =>
      previousImages.filter((_, index) => index !== indexToRemove)
    );
  };

  // Create and clean up image preview URLs
  useEffect(() => {
    const urls = images.map((image) => URL.createObjectURL(image));

    previewUrlsRef.current = urls;

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  // Clear form after successful submission
const clearFormAfterSuccess = () => {
  setData({ ...initialData });
  setImages([]);

  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
};

  // Live discount calculation (Market Price vs Selling Price)
  const marketPriceNumber = Number(data.marketPrice);
  const sellingPriceNumber = Number(data.price);
  const discountPercentage =
    data.marketPrice !== "" &&
    data.price !== "" &&
    Number.isFinite(marketPriceNumber) &&
    Number.isFinite(sellingPriceNumber) &&
    marketPriceNumber > 0 &&
    marketPriceNumber > sellingPriceNumber
      ? Math.round(((marketPriceNumber - sellingPriceNumber) / marketPriceNumber) * 100)
      : 0;

  // Submit product
  const onSubmitHandler = async (event) => {
    event.preventDefault();

    // Prevent duplicate submissions
    if (loading) {
      return;
    }

    if (!data.name.trim()) {
      showPopup("error", "Please enter product name.");
      return;
    }

    if (!data.description.trim()) {
      showPopup("error", "Please enter product description.");
      return;
    }

  if (!data.parentCategory) {
  showPopup("error", "Please select a parent category.");
  return;
}

if (!data.category) {
  showPopup("error", "Please select a child category.");
  return;
}

    if (
      data.price === "" ||
      !Number.isFinite(Number(data.price)) ||
      Number(data.price) < 0
    ) {
      showPopup("error", "Please enter a valid price.");
      return;
    }

    if (
      data.marketPrice !== "" &&
      (!Number.isFinite(Number(data.marketPrice)) ||
        Number(data.marketPrice) < 0)
    ) {
      showPopup("error", "Please enter a valid market price.");
      return;
    }

    if (
      data.marketPrice !== "" &&
      Number(data.marketPrice) > 0 &&
      Number(data.marketPrice) < Number(data.price)
    ) {
      showPopup(
        "error",
        "Market price must be equal to or greater than the selling price."
      );
      return;
    }

    if (
      data.stock !== "" &&
      (!Number.isInteger(Number(data.stock)) ||
        Number(data.stock) < 0)
    ) {
      showPopup("error", "Please enter a valid stock quantity.");
      return;
    }

    if (images.length === 0) {
      showPopup("error", "Please select at least one product image.");
      return;
    }

    if (images.length > MAX_IMAGES) {
      showPopup("error", `You can upload a maximum of ${MAX_IMAGES} images.`);
      return;
    }

    const formData = new FormData();

    formData.append("name", data.name.trim());
    formData.append("description", data.description.trim());
   formData.append("parentCategory", data.parentCategory);
formData.append("category", data.category);
    formData.append("price", String(data.price));
    formData.append(
      "marketPrice",
      data.marketPrice === "" ? "" : String(data.marketPrice)
    );
    formData.append(
      "stock",
      data.stock === "" ? "0" : String(data.stock)
    );

    images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      setLoading(true);
      closePopup();

      const response = await axios.post(
        `${API_URL}/api/products/add`,
        formData
      );

      if (response.data.success) {
        clearFormAfterSuccess();

        showPopup(
          "success",
          response.data.message || "Product added successfully!"
        );
      } else {
        showPopup(
          "error",
          response.data.message || "Failed to add product."
        );
      }
    } catch (error) {
      console.error("Add product error:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        (error.code === "ERR_NETWORK"
          ? "Cannot connect to the server. Please check your backend."
          : "Something went wrong while adding the product.");

      showPopup("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-page">
      <div className="add-page-header">
        <div>
          <h2>Add Product</h2>
          <p>Add product details and upload multiple images.</p>
        </div>
      </div>

      {/* Success / Error Popup */}
      {popup.show && (
        <div
          className={`add-popup ${popup.type}`}
          role="alert"
          aria-live="polite"
        >
          <div className="popup-icon">
            {popup.type === "success" ? "✓" : "!"}
          </div>

          <div className="popup-content">
            <strong>
              {popup.type === "success"
                ? "Success!"
                : "Something went wrong"}
            </strong>

            <p>{popup.message}</p>
          </div>

          <button
            type="button"
            className="popup-close"
            onClick={closePopup}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      <form
        className="add-form-container"
        onSubmit={onSubmitHandler}
      >
        {/* Product Name */}
        <div className="add-form">
          <label htmlFor="product-name">Product Name</label>

          <input
            id="product-name"
            type="text"
            name="name"
            value={data.name}
            onChange={onChangeHandler}
            placeholder="Enter product name"
            required
            disabled={loading}
          />
        </div>

        {/* Description */}
        <div className="add-form">
          <label htmlFor="product-description">Description</label>

          <textarea
            id="product-description"
            name="description"
            value={data.description}
            onChange={onChangeHandler}
            placeholder="Enter product description"
            rows="4"
            required
            disabled={loading}
          />
        </div>

        {/* Multiple Images */}
        <div className="add-form">
          <label htmlFor="product-images">Product Images</label>

          <input
            ref={fileInputRef}
            id="product-images"
            type="file"
            accept="image/*"
            multiple
            onChange={onImageChange}
            disabled={loading || images.length >= MAX_IMAGES}
          />

          <small>
            Select up to {MAX_IMAGES} images. Maximum 5 MB per image.
          </small>

          {images.length > 0 && (
            <div className="image-preview-grid">
              {images.map((image, index) => (
                <div
                  className="image-preview-item"
                  key={`${image.name}-${image.size}-${image.lastModified}`}
                >
                  <img
                    src={previewUrlsRef.current[index] || ""}
                    alt={`Product preview ${index + 1}`}
                  />

                  <span>Image {index + 1}</span>

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="image-count">
            {images.length} / {MAX_IMAGES} images selected
          </p>
        </div>

   {/* Parent Category */}
<div className="add-form">
  <label htmlFor="parent-category">
    Parent Category
  </label>

  <select
    id="parent-category"
    value={data.parentCategory}
    onChange={onParentCategoryChange}
    required
    disabled={loading || categoriesLoading}
  >
    <option value="">Select Parent Category</option>

    {parentCategories.map((parent) => (
      <option key={parent._id} value={parent._id}>
        {parent.name}
      </option>
    ))}
  </select>
</div>

{/* Child Category */}
<div className="add-form">
  <label htmlFor="product-category">
    Child Category
  </label>

  <select
    id="product-category"
    name="category"
    value={data.category}
    onChange={onChangeHandler}
    required
    disabled={
      loading ||
      !data.parentCategory ||
      filteredCategories.length === 0
    }
  >
    <option value="">Select Child Category</option>

    {filteredCategories.map((category) => (
      <option key={category._id} value={category._id}>
        {category.name}
      </option>
    ))}
  </select>

  {data.parentCategory && filteredCategories.length === 0 && (
    <small>No child categories available for this parent.</small>
  )}
</div>
{/* Market Price */}

<div className="add-form">
  <label htmlFor="marketPrice">Market Price (₹)</label>

<input
 id="marketPrice"
 type="number"
 name="marketPrice"
 value={data.marketPrice}
 onChange={onChangeHandler}
 placeholder="Enter market price"
 min="0"
 disabled={loading}
/>

</div>

{/* Selling Price */}

<div className="add-form">
  <label htmlFor="sellingPrice">Selling Price (₹)</label>

<input
 id="sellingPrice"
 type="number"
 name="price"
 value={data.price}
 onChange={onChangeHandler}
 placeholder="Enter selling price"
 min="0"
 required
 disabled={loading}
/>

</div>

{/* Discount */}
{discountPercentage > 0 && (

  <div className="add-form">
    <label>Discount</label>
    <strong>{discountPercentage}% OFF</strong>
  </div>
)}

{/* Stock */}

<div className="add-form">
  <label htmlFor="stock">Stock Quantity</label>

<input
 id="stock"
 type="number"
 name="stock"
 value={data.stock}
 onChange={onChangeHandler}
 placeholder="Enter available stock"
 min="0"
 step="1"
 disabled={loading}
/>

</div>

        {/* Only Add Product Button - No Reset Button */}
        <div className="add-form-actions">
          <button
            type="submit"
            className={`add-btn ${loading ? "is-loading" : ""}`}
            disabled={
              loading ||
              categoriesLoading ||
              parentCategories.length === 0 ||
categories.length === 0
            }
          >
            {loading ? (
              <>
                <span className="button-spinner" />
                <span>Saving Product...</span>
              </>
            ) : (
              "Add Product"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Add;

