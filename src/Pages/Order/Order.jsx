import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./Order.css";
import API_URL from "../../api/api";

const ORDER_STATUSES = [
"Pending",
"Confirmed",
"Processing",
"Shipped",
"Delivered",
"Cancelled",
];

const PAYMENT_STATUSES = [
"Pending",
"Paid",
"Failed",
"Refunded",
];

const formatPrice = (amount) =>
new Intl.NumberFormat("en-IN", {
style: "currency",
currency: "INR",
maximumFractionDigits: 2,
}).format(Number(amount || 0));

const formatDate = (date) => {
if (!date) return "N/A";

return new Date(date).toLocaleString("en-IN", {
day: "2-digit",
month: "short",
year: "numeric",
hour: "2-digit",
minute: "2-digit",
});
};

const getStatusClass = (status = "") =>
String(status).toLowerCase().replace(/\s+/g, "-");

const Order = () => {
const [orders, setOrders] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
const [paymentFilter, setPaymentFilter] = useState("All");

const [page, setPage] = useState(1);
const [pagination, setPagination] = useState({
currentPage: 1,
totalPages: 1,
totalOrders: 0,
});

const [selectedOrder, setSelectedOrder] = useState(null);
const [detailsLoading, setDetailsLoading] = useState(false);
const [updatingId, setUpdatingId] = useState("");
const [notice, setNotice] = useState("");

const fetchOrders = useCallback(async () => {
setLoading(true);
setError("");


try {
  const response = await axios.get(`${API_URL}/api/orders/admin/list`, {
    params: {
      search: search.trim(),
      status: statusFilter,
      paymentStatus: paymentFilter,
      page,
      limit: 20,
    },
  });

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Unable to load orders.");
  }

  setOrders(response.data.orders || []);
  setPagination(
    response.data.pagination || {
      currentPage: 1,
      totalPages: 1,
      totalOrders: 0,
    }
  );
} catch (err) {
  setError(
    err.response?.data?.message ||
      err.message ||
      "Could not connect to the server."
  );
} finally {
  setLoading(false);
}


}, [search, statusFilter, paymentFilter, page]);

useEffect(() => {
const timer = setTimeout(() => {
fetchOrders();
}, 300);


return () => clearTimeout(timer);


}, [fetchOrders]);

const showNotice = (message) => {
setNotice(message);
setTimeout(() => setNotice(""), 3000);
};

const openOrderDetails = async (order) => {
setDetailsLoading(true);
setSelectedOrder(order);


try {
  const response = await axios.get(
    `${API_URL}/api/orders/admin/${order._id}`
  );

  if (response.data?.success) {
    setSelectedOrder(response.data.order);
  }
} catch (err) {
  showNotice(
    err.response?.data?.message || "Could not load complete order details."
  );
} finally {
  setDetailsLoading(false);
}


};

const updateOrder = async (orderId, changes) => {
setUpdatingId(orderId);
setError("");
setNotice("");


try {
  const response = await axios.patch(
    `${API_URL}/api/orders/admin/${orderId}/status`,
    changes
  );

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Order update failed.");
  }

  const updatedOrder = response.data.order;

  setOrders((previous) =>
    previous.map((order) =>
      order._id === orderId ? { ...order, ...updatedOrder } : order
    )
  );

  setSelectedOrder((previous) =>
    previous?._id === orderId
      ? { ...previous, ...updatedOrder }
      : previous
  );

  showNotice("Order updated successfully.");
  await fetchOrders();
} catch (err) {
  showNotice(
    err.response?.data?.message ||
      err.message ||
      "Unable to update order."
  );
} finally {
  setUpdatingId("");
}


};

const orderStats = {
total: pagination.totalOrders,
pending: orders.filter((order) => order.status === "Pending").length,
confirmed: orders.filter((order) => order.status === "Confirmed").length,
delivered: orders.filter((order) => order.status === "Delivered").length,
};

const resetFilters = () => {
setSearch("");
setStatusFilter("All");
setPaymentFilter("All");
setPage(1);
};

return ( <div className="orders-page"> <div className="orders-heading"> <div> <p className="orders-eyebrow">NILE ADMIN PANEL</p> <h1>Order Management</h1> <p className="orders-subtitle">
View customer orders, manage delivery status and payment details. </p> </div>


    <button
      className="orders-refresh-btn"
      type="button"
      onClick={fetchOrders}
      disabled={loading}
    >
      {loading ? "Refreshing..." : "↻ Refresh"}
    </button>
  </div>

  {notice && (
    <div className="orders-notice" role="status">
      {notice}
    </div>
  )}

  <div className="orders-stats">
    <div className="orders-stat-card">
      <span>Total Orders</span>
      <strong>{orderStats.total}</strong>
      <small>Matching current filters</small>
    </div>

    <div className="orders-stat-card">
      <span>Pending</span>
      <strong>
        {statusFilter === "Pending"
          ? orderStats.total
          : orderStats.pending}
      </strong>
      <small>On the current page</small>
    </div>

    <div className="orders-stat-card">
      <span>Confirmed</span>
      <strong>{orderStats.confirmed}</strong>
      <small>On the current page</small>
    </div>

    <div className="orders-stat-card">
      <span>Delivered</span>
      <strong>{orderStats.delivered}</strong>
      <small>On the current page</small>
    </div>
  </div>

  <div className="orders-toolbar">
    <div className="orders-search">
      <span>⌕</span>
      <input
        type="search"
        placeholder="Search order ID, customer name or phone..."
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
      />
    </div>

    <select
      value={statusFilter}
      onChange={(event) => {
        setStatusFilter(event.target.value);
        setPage(1);
      }}
      aria-label="Filter by order status"
    >
      <option value="All">All Order Statuses</option>
      {ORDER_STATUSES.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>

    <select
      value={paymentFilter}
      onChange={(event) => {
        setPaymentFilter(event.target.value);
        setPage(1);
      }}
      aria-label="Filter by payment status"
    >
      <option value="All">All Payment Statuses</option>
      {PAYMENT_STATUSES.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>

    <button
      type="button"
      className="orders-reset-btn"
      onClick={resetFilters}
    >
      Reset
    </button>
  </div>

  {error && (
    <div className="orders-error">
      <strong>Unable to load orders</strong>
      <p>{error}</p>
      <button type="button" onClick={fetchOrders}>
        Try Again
      </button>
    </div>
  )}

  <div className="orders-table-card">
    <div className="orders-table-header">
      <div>
        <h2>Customer Orders</h2>
        <p>{pagination.totalOrders} orders found</p>
      </div>
    </div>

    {loading ? (
      <div className="orders-loading">
        <div className="orders-spinner" />
        <p>Loading orders...</p>
      </div>
    ) : !error && orders.length === 0 ? (
      <div className="orders-empty">
        <div className="orders-empty-icon">📦</div>
        <h3>No orders found</h3>
        <p>
          Orders will appear here when customers place orders on your
          website.
        </p>
      </div>
    ) : (
      !error && (
        <>
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order Details</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Order Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => {
                  const customerName = [
                    order.customer?.firstName,
                    order.customer?.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <tr key={order._id}>
                      <td>
                        <div className="orders-id">
                          {order.orderId || order._id}
                        </div>
                        <div className="orders-item-count">
                          {order.items?.length || 0} product(s)
                        </div>
                      </td>

                      <td>
                        <div className="orders-customer-name">
                          {customerName || "Customer"}
                        </div>
                        <div className="orders-phone">
                          {order.customer?.phone || "N/A"}
                        </div>
                      </td>

                      <td>
                        <strong className="orders-amount">
                          {formatPrice(order.totalAmount)}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`orders-badge payment-${getStatusClass(
                            order.paymentStatus
                          )}`}
                        >
                          {order.paymentStatus || "Pending"}
                        </span>
                      </td>

                      <td>
                        <select
                          className={`orders-status-select status-${getStatusClass(
                            order.status
                          )}`}
                          value={order.status || "Pending"}
                          disabled={updatingId === order._id}
                          onChange={(event) =>
                            updateOrder(order._id, {
                              status: event.target.value,
                            })
                          }
                          aria-label={`Update status for ${order.orderId}`}
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="orders-date">
                        {formatDate(order.createdAt)}
                      </td>

                      <td>
                        <button
                          className="orders-view-btn"
                          type="button"
                          onClick={() => openOrderDetails(order)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="orders-pagination">
            <span>
              Page {pagination.currentPage || page} of{" "}
              {pagination.totalPages || 1}
            </span>

            <div>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((previous) => previous - 1)}
              >
                Previous
              </button>

              <button
                type="button"
                disabled={page >= (pagination.totalPages || 1)}
                onClick={() => setPage((previous) => previous + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )
    )}
  </div>

  {selectedOrder && (
    <div
      className="orders-modal-overlay"
      onClick={() => setSelectedOrder(null)}
    >
      <section
        className="orders-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="orders-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="orders-modal-header">
          <div>
            <p>ORDER DETAILS</p>
            <h2 id="orders-modal-title">
              {selectedOrder.orderId || selectedOrder._id}
            </h2>
          </div>

          <button
            type="button"
            className="orders-modal-close"
            onClick={() => setSelectedOrder(null)}
            aria-label="Close order details"
          >
            ×
          </button>
        </div>

        {detailsLoading ? (
          <div className="orders-loading">
            <div className="orders-spinner" />
            <p>Loading details...</p>
          </div>
        ) : (
          <div className="orders-modal-body">
            <div className="orders-detail-section">
              <h3>Customer Information</h3>

              <div className="orders-detail-grid">
                <div>
                  <span>Customer Name</span>
                  <strong>
                    {selectedOrder.customer?.firstName}{" "}
                    {selectedOrder.customer?.lastName}
                  </strong>
                </div>

                <div>
                  <span>Phone</span>
                  <strong>{selectedOrder.customer?.phone || "N/A"}</strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>{selectedOrder.customer?.email || "N/A"}</strong>
                </div>

                <div>
                  <span>Order Date</span>
                  <strong>{formatDate(selectedOrder.createdAt)}</strong>
                </div>
              </div>
            </div>

            <div className="orders-detail-section">
              <h3>Delivery Address</h3>
              <p className="orders-address">
                {[
                  selectedOrder.address?.house,
                  selectedOrder.address?.street,
                  selectedOrder.address?.city,
                  selectedOrder.address?.district,
                  selectedOrder.address?.state,
                  selectedOrder.address?.pincode,
                ]
                  .filter(Boolean)
                  .join(", ") || "Address unavailable"}
              </p>
            </div>

            <div className="orders-detail-section">
              <h3>Products Ordered</h3>

              <div className="orders-items-list">
                {(selectedOrder.items || []).map((item, index) => (
                  <div
                    className="orders-product-row"
                    key={`${item.productId || item.name}-${index}`}
                  >
                    <div>
                      <strong>{item.name || "Product"}</strong>
                      <span>
                        {formatPrice(item.price)} × {item.quantity}
                      </span>
                    </div>

                    <strong>
                      {formatPrice(
                        item.lineTotal ??
                          Number(item.price || 0) *
                            Number(item.quantity || 0)
                      )}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="orders-total-row">
                <span>Subtotal</span>
                <strong>{formatPrice(selectedOrder.subtotal)}</strong>
              </div>

              <div className="orders-total-row">
                <span>Delivery Charge</span>
                <strong>
                  {formatPrice(selectedOrder.deliveryCharge)}
                </strong>
              </div>

              <div className="orders-total-row grand-total">
                <span>Total Amount</span>
                <strong>{formatPrice(selectedOrder.totalAmount)}</strong>
              </div>
            </div>

            {selectedOrder.notes && (
              <div className="orders-detail-section">
                <h3>Customer Notes</h3>
                <p className="orders-address">{selectedOrder.notes}</p>
              </div>
            )}

            <div className="orders-detail-section">
              <h3>Update Payment Status</h3>

              <select
                className="orders-modal-select"
                value={selectedOrder.paymentStatus || "Pending"}
                disabled={updatingId === selectedOrder._id}
                onChange={(event) =>
                  updateOrder(selectedOrder._id, {
                    paymentStatus: event.target.value,
                  })
                }
              >
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="orders-detail-section">
              <h3>Update Order Status</h3>

              <select
                className="orders-modal-select"
                value={selectedOrder.status || "Pending"}
                disabled={updatingId === selectedOrder._id}
                onChange={(event) =>
                  updateOrder(selectedOrder._id, {
                    status: event.target.value,
                  })
                }
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="orders-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )}
</div>


);
};

export default Order;
