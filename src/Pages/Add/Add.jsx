import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./Add.css";
import API_URL from "../../api/api";
const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const initialData = {
  name: "",
  description: "",
  category: "",
  marketPrice: "",
  price: "",
  stock: "",
};

const Add = () => {
  const [data, setData] = useState(initialData);
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
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
          const activeCategories = (response.data.data || []).filter(
            (category) => category.isActive !== false
          );

          setCategories(activeCategories);

          if (activeCategories.length > 0) {
            setData((prev) => ({
              ...prev,
              category: prev.category || activeCategories[0].name,
            }));
          }
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
    setData({
      ...initialData,
      category: categories.length > 0 ? categories[0].name : "",
    });

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

    if (!data.category) {
      showPopup("error", "Please select a category.");
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

        {/* Category, Price, Stock */}
        <div className="add-form-grid">
          <div className="add-form">
            <label htmlFor="product-category">Category</label>

            <select
              id="product-category"
              name="category"
              value={data.category}
              onChange={onChangeHandler}
              required
              disabled={loading || categoriesLoading}
            >
              <option value="">
                {categoriesLoading
                  ? "Loading categories..."
                  : "Select category"}
              </option>

              {categories.map((category) => (
                <option
                  key={category._id || category.name}
                  value={category.name}
                >
                  {category.name}
                </option>
              ))}
            </select>

            {!categoriesLoading && categories.length === 0 && (
              <small>Please add a category first.</small>
            )}
          </div>

          <div className="add-form">
            <label htmlFor="product-market-price">Market Price / MRP (₹)</label>

            <input
              id="product-market-price"
              type="number"
              name="marketPrice"
              min="0"
              step="0.01"
              value={data.marketPrice}
              onChange={onChangeHandler}
              placeholder="Enter original price"
              disabled={loading}
            />
            <small>Optional — original price before discount.</small>
          </div>

          <div className="add-form">
            <label htmlFor="product-price">Selling Price (₹)</label>

            <input
              id="product-price"
              type="number"
              name="price"
              min="0"
              step="0.01"
              value={data.price}
              onChange={onChangeHandler}
              placeholder="Enter price"
              required
              disabled={loading}
            />
            {discountPercentage > 0 && (
              <small className="discount-preview">
                Customer discount: {discountPercentage}% OFF
                {" · "}
                Save ₹{(marketPriceNumber - sellingPriceNumber).toFixed(2)}
              </small>
            )}
          </div>

          <div className="add-form">
            <label htmlFor="product-stock">Stock Quantity</label>

            <input
              id="product-stock"
              type="number"
              name="stock"
              min="0"
              step="1"
              value={data.stock}
              onChange={onChangeHandler}
              placeholder="Enter stock quantity"
              disabled={loading}
            />
          </div>
        </div>

        {/* Only Add Product Button - No Reset Button */}
        <div className="add-form-actions">
          <button
            type="submit"
            className={`add-btn ${loading ? "is-loading" : ""}`}
            disabled={
              loading ||
              categoriesLoading ||
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

