import React, { useEffect, useMemo, useState } from "react";
import "./List.css";
import axios from "axios";
import API_URL from "../../api/api";

const getProductImageUrl = (image) => {
  if (!image) return "";

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${API_URL.replace(/\/+$/, "")}/images/${image.replace(/^\/+/, "")}`;
};
const List = () => {
const [list, setList] = useState([]);
const [loading, setLoading] = useState(true);
const [deletingId, setDeletingId] = useState(null);
const [search, setSearch] = useState("");
const [notification, setNotification] = useState({
show: false,
type: "",
message: "",
});
const [deleteTarget, setDeleteTarget] = useState(null);

const fetchList = async () => {
try {
const response = await axios.get(
`${API_URL}/api/products/list`
);


  if (response.data.success) {
    setList(response.data.data || []);
  } else {
    showNotification(
      "error",
      response.data.message || "Unable to load products."
    );
  }
} catch (error) {
  console.error("Product list error:", error);

  showNotification(
    "error",
    error.response?.data?.message ||
      "Unable to load products. Check your backend."
  );
} finally {
  setLoading(false);
}


};

const showNotification = (type, message) => {
setNotification({
show: true,
type,
message,
});


window.setTimeout(() => {
  setNotification((previous) => ({
    ...previous,
    show: false,
  }));
}, 3000);


};

const removeProduct = async () => {
if (!deleteTarget || deletingId) return;


const productId = deleteTarget._id;

setDeletingId(productId);

try {
  const response = await axios.post(
    `${API_URL}/api/products/remove`,
    { id: productId }
  );

  if (response.data.success) {
    setList((previous) =>
      previous.filter((item) => item._id !== productId)
    );

    setDeleteTarget(null);

    showNotification(
      "success",
      response.data.message || "Product deleted successfully."
    );
  } else {
    showNotification(
      "error",
      response.data.message || "Product could not be deleted."
    );
  }
} catch (error) {
  console.error("Delete product error:", error);

  showNotification(
    "error",
    error.response?.data?.message ||
      "Unable to delete product."
  );
} finally {
  setDeletingId(null);
}


};

useEffect(() => {
fetchList();
}, []);

const filteredProducts = useMemo(() => {
const query = search.trim().toLowerCase();


if (!query) return list;

return list.filter((item) => {
  return (
    item.name?.toLowerCase().includes(query) ||
    item.category?.toLowerCase().includes(query) ||
    String(item.price ?? "").includes(query)
  );
});


}, [list, search]);

const formatPrice = (price) =>
Number(price || 0).toLocaleString("en-IN", {
maximumFractionDigits: 2,
});

return ( <div className="product-list-page">
{/* Notification */}
{notification.show && (
<div
className={`list-notification ${notification.type}`}
role="alert"
> <span className="notification-icon">
{notification.type === "success" ? "✓" : "!"} </span>


      <div className="notification-message">
        <strong>
          {notification.type === "success" ? "Success" : "Error"}
        </strong>
        <p>{notification.message}</p>
      </div>

      <button
        type="button"
        className="notification-close"
        onClick={() =>
          setNotification((previous) => ({
            ...previous,
            show: false,
          }))
        }
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  )}

  {/* Page Header */}
  <div className="product-list-header">
    <div>
      <h1>Products</h1>
      <p>Manage your store products and inventory.</p>
    </div>

    <div className="product-count">
      <span className="product-count-number">{list.length}</span>
      <span>Total Products</span>
    </div>
  </div>

  {/* Search */}
  <div className="product-list-toolbar">
    <div className="product-search">
      <span className="search-icon">⌕</span>

      <input
        type="search"
        placeholder="Search by product name or category..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        aria-label="Search products"
      />

      {search && (
        <button
          type="button"
          className="clear-search"
          onClick={() => setSearch("")}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>

    <button
      type="button"
      className="refresh-products-btn"
      onClick={() => {
        setLoading(true);
        fetchList();
      }}
      disabled={loading}
    >
      <span className={loading ? "refresh-icon spinning" : "refresh-icon"}>
        ↻
      </span>
      Refresh
    </button>
  </div>

  {/* Loading */}
  {loading ? (
    <div className="product-list-state">
      <span className="list-loading-spinner"></span>
      <p>Loading products...</p>
    </div>
  ) : filteredProducts.length === 0 ? (
    <div className="product-list-state empty-products">
      <div className="empty-products-icon">▤</div>
      <h3>{search ? "No matching products" : "No products yet"}</h3>
      <p>
        {search
          ? "Try searching with another name or category."
          : "Products you add will appear here."}
      </p>

      {search && (
        <button
          type="button"
          className="clear-filter-btn"
          onClick={() => setSearch("")}
        >
          Clear Search
        </button>
      )}
    </div>
  ) : (
    <>
      {/* Desktop Table */}
      <div className="product-table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th className="product-image-column">Product</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th className="product-action-column">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((item) => (
              <tr key={item._id}>
                <td>
   <img
  className="product-table-image"
src={getProductImageUrl(item.images?.[0] || item.image)}
  alt={item.name}
  loading="lazy"
  onError={(event) => {
    console.error("Product image failed:", event.currentTarget.src);
    event.currentTarget.style.visibility = "hidden";
  }}
/>
                </td>

                <td>
                  <span className="table-product-name">
                    {item.name}
                  </span>
                </td>

                <td>
                  <span className="product-category-badge">
                    {item.category || "Uncategorized"}
                  </span>
                </td>

                <td>
                  <span className="product-price">
                    ₹{formatPrice(item.price)}
                  </span>
                </td>

                <td>
                  <span
                    className={`stock-badge ${
                      Number(item.stock ?? 0) > 0
                        ? "in-stock"
                        : "out-of-stock"
                    }`}
                  >
                    {item.stock ?? 0} units
                  </span>
                </td>

                <td>
                  <button
                    type="button"
                    className="delete-product-btn"
                    onClick={() => setDeleteTarget(item)}
                    disabled={deletingId === item._id}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Product Cards */}
      <div className="mobile-product-list">
        {filteredProducts.map((item) => (
          <article className="mobile-product-card" key={item._id}>
            <div className="mobile-product-top">
         <img
  className="mobile-product-image"
  src={getProductImageUrl(item.images?.[0] || item.image)}
  alt={item.name}
  loading="lazy"
  onError={(event) => {
    console.error("Product image failed:", event.currentTarget.src);
    event.currentTarget.style.visibility = "hidden";
  }}
/>

              <div className="mobile-product-info">
                <h3>{item.name}</h3>

                <span className="product-category-badge">
                  {item.category || "Uncategorized"}
                </span>

                <strong className="mobile-product-price">
                  ₹{formatPrice(item.price)}
                </strong>
              </div>
            </div>

            <div className="mobile-product-footer">
              <div className="mobile-stock-info">
                <span>Available Stock</span>
                <strong>{item.stock ?? 0} units</strong>
              </div>

              <button
                type="button"
                className="delete-product-btn"
                onClick={() => setDeleteTarget(item)}
                disabled={deletingId === item._id}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="product-list-footer">
        Showing <strong>{filteredProducts.length}</strong> of{" "}
        <strong>{list.length}</strong> products
      </div>
    </>
  )}

  {/* Delete Confirmation Modal */}
  {deleteTarget && (
    <div
      className="delete-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !deletingId
        ) {
          setDeleteTarget(null);
        }
      }}
    >
      <div
        className="delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        <div className="delete-modal-icon">!</div>

        <h2 id="delete-modal-title">Delete Product?</h2>

        <p>
          Are you sure you want to delete{" "}
          <strong>{deleteTarget.name}</strong>? This action cannot
          be undone.
        </p>

        <div className="delete-modal-actions">
          <button
            type="button"
            className="cancel-delete-btn"
            onClick={() => setDeleteTarget(null)}
            disabled={Boolean(deletingId)}
          >
            Cancel
          </button>

          <button
            type="button"
            className="confirm-delete-btn"
            onClick={removeProduct}
            disabled={Boolean(deletingId)}
          >
            {deletingId ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  )}
</div>


);
};

export default List;
