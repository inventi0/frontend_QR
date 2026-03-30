import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./ProfilePage.scss";
import {
  useGetMeQuery,
  useUpdateUserMutation,
  useUpdateUserProfileMutation,
  useSetActiveTemplateMutation
} from "../api/authApi";
import {
  useDeleteTemplateMutation,
  useGetUserQrQuery,
  useSyncOrderDeliveryStatusMutation,
  useListUserTemplatesQuery,
  useListMyOrdersQuery,
} from "../api/accountApi";
import Copy from "../components/icons/Copy";
import { FaStar, FaCheck, FaPen, FaTrashAlt } from "react-icons/fa";
import { formatRub } from "../utils/money";
import EyePasswordShow from "../components/icons/EyePasswordShow";
import { useNavigate } from "react-router-dom";
import { getOrderStatusText, getOrderStatusClass } from "../utils/orderStatus";
import defaultAvatar from "../assets/Avatar.png";

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const date = d.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const time = d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date}, ${time}`;
};

export const ProfilePage = () => {
  const { data: me, isLoading: isMeLoading, isError: isMeError } =
    useGetMeQuery();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-scroll to #orders when navigating from OrderSuccess
  useEffect(() => {
    if (location.hash === "#orders") {
      setTimeout(() => {
        document.getElementById("orders")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, [location.hash]);

  const userId = me?.id;

  const {
    data: templates,
    isLoading: isTemplatesLoading
  } = useListUserTemplatesQuery(
    { userId, includeGlobal: true, limit: 50, offset: 0 },
    { skip: !userId }
  );

  const {
    data: orders,
    isLoading: isOrdersLoading,
    isError: isOrdersError,
  } = useListMyOrdersQuery({ limit: 20, offset: 0 }, { skip: !userId });

  const [copyState, setCopyState] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const fileInputRef = useRef(null);

  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
  const [updateUserProfile, { isLoading: isUpdatingProfile }] = useUpdateUserProfileMutation();
  const [deleteTemplate, { isLoading: isDeletingTemplate }] = useDeleteTemplateMutation();
  const [setActiveTemplate, { isLoading: isSettingActive }] = useSetActiveTemplateMutation();
  const [syncDeliveryStatus, { isLoading: isSyncing }] = useSyncOrderDeliveryStatusMutation();

  // Получаем QR-код пользователя
  const { data: qrData } = useGetUserQrQuery(userId, { skip: !userId });

  const handleCopy = (value) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopyState(true);
    setTimeout(() => setCopyState(false), 700);
  };

  const openEditor = (tpl) => {
    navigate("/creator", { state: { template: tpl, templateUrl: tpl?.file_url } });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Пожалуйста, выберите изображение");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Размер файла не должен превышать 5MB");
      return;
    }

    setUploadError("");
    setAvatarPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      await updateUser(formData).unwrap();
    } catch {
      setUploadError("Не удалось загрузить аватар");
      setAvatarPreview(null);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот шаблон?")) {
      return;
    }

    try {
      await deleteTemplate(templateId).unwrap();
    } catch {
      alert("Не удалось удалить шаблон");
    }
  };

  const handleSetActiveTemplate = async (templateId) => {
    try {
      await setActiveTemplate({
        templateId,
        baseUrl: window.location.origin,
      }).unwrap();
      alert("Активный шаблон изменен! Теперь ваш QR-код ведет на этот дизайн.");
    } catch (err) {
      console.error("Failed to set active template", err);
      alert("Не удалось установить активный шаблон");
    }
  };

  const handleEditUsername = () => {
    setNewUsername(me.username);
    setIsEditingUsername(true);
  };

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) {
      alert("Имя не может быть пустым");
      return;
    }

    if (newUsername === me.username) {
      setIsEditingUsername(false);
      return;
    }

    try {
      await updateUserProfile({ username: newUsername.trim() }).unwrap();
      setIsEditingUsername(false);
      alert("Имя пользователя обновлено!");
    } catch (err) {
      console.error("Failed to update username", err);
      alert("Не удалось обновить имя");
    }
  };

  const handleCancelEditUsername = () => {
    setIsEditingUsername(false);
    setNewUsername("");
  };

  if (isMeLoading) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-core"></div>
        </div>
        <div className="loading-text">Загружаем профиль...</div>
      </div>
    );
  }

  if (isMeError || !me) {
    return (
      <div className="profile-page">
        <div className="card card-error">
          Авторизуйтесь, чтобы увидеть профиль.
        </div>
      </div>
    );
  }

  const avatar = avatarPreview || me.img_url || defaultAvatar;

  return (
    <div className="profile-page">
      <div className="profile-two-column">
        <div className="profile-sidebar">
          <div className="profile-info-card">
            <div className="avatar-wrapper" onClick={handleAvatarClick}>
              <img src={avatar} alt={me.username} className="avatar" />
              <div className="avatar-overlay">
                <span>Изменить</span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                style={{ display: "none" }}
              />
            </div>
            {uploadError && <div className="error-text">{uploadError}</div>}
            {isUpdatingUser && <div className="muted">Загружаем...</div>}

            {/* Имя пользователя с возможностью редактирования */}
            {isEditingUsername ? (
              <div className="username-edit-section">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="username-input"
                  placeholder="Введите имя"
                  maxLength={30}
                  disabled={isUpdatingProfile}
                />
                <div className="username-actions">
                  <button
                    className="save-username-btn"
                    onClick={handleSaveUsername}
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? "Сохраняем..." : "Сохранить"}
                  </button>
                  <button
                    className="cancel-username-btn"
                    onClick={handleCancelEditUsername}
                    disabled={isUpdatingProfile}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="username-display-section">
                <h1>{me.username}</h1>
                <button
                  className="edit-username-btn"
                  onClick={handleEditUsername}
                  title="Изменить имя"
                >
                  Изменить
                </button>
              </div>
            )}

            <div className="user-id-section">
              <button className="copy-btn" onClick={() => handleCopy(me.id)}>
                <Copy />
                {copyState ? "Скопировано" : `User ID: ${me.id}`}
              </button>
            </div>

            {/* QR-код профиля */}
            {qrData?.qr_image_url && (
              <div className="qr-section">
                <h3>Ваш QR-код</h3>
                <div className="qr-image-container">
                  <img
                    src={qrData.qr_image_url}
                    alt="QR-код профиля"
                    className="qr-image"
                  />
                </div>
                <p className="qr-hint">
                  Поделитесь этим QR-кодом чтобы показать свой активный дизайн
                </p>
                {qrData.current_template_id && (
                  <div className="qr-template-info">
                    <span className="muted">Активный шаблон: </span>
                    <strong>Дизайн #{qrData.current_template_id}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="profile-main">
          <div className="templates-card">
            <div className="card-header">
              <h3>Ваши шаблоны</h3>
              <button
                className="add-template-btn-header"
                onClick={() => openEditor(null)}
                title="Добавить новый шаблон"
              >
                + Добавить шаблон
              </button>
            </div>

            <div className="templates-list">
              {templates && templates.length > 0 ? (
                templates.map((tpl) => (
                  <div key={tpl.id} className="template-item">
                    <div className="template-thumb">
                      {tpl.file_url ? (
                        <img src={tpl.file_url} alt={tpl.name || `Дизайн №${tpl.id}`} />
                      ) : (
                        <div className="template-placeholder">Нет превью</div>
                      )}
                    </div>
                    <div className="template-content">
                      <div className="template-header">
                        <h4>{tpl.name || `Дизайн №${tpl.id}`}</h4>
                        {qrData?.current_template_id === tpl.id && (
                          <span className="active-badge" title="Активный шаблон">★</span>
                        )}
                      </div>
                      {tpl.created_at && (
                        <p className="template-date">{formatDateTime(tpl.created_at)}</p>
                      )}
                      <div className="template-actions">
                        <button
                          className={`set-active-btn ${qrData?.current_template_id === tpl.id ? 'is-active' : ''}`}
                          onClick={() => handleSetActiveTemplate(tpl.id)}
                          disabled={isSettingActive || qrData?.current_template_id === tpl.id}
                          title={qrData?.current_template_id === tpl.id ? "Уже активный" : "Сделать активным для QR"}
                          aria-label={qrData?.current_template_id === tpl.id ? "Шаблон активен" : "Сделать активным"}
                        >
                          {qrData?.current_template_id === tpl.id ? <FaCheck /> : <FaStar />}
                        </button>
                        {tpl.file_url && (
                          <button
                            className="apply-btn secondary"
                            onClick={() => openEditor(tpl)}
                            title="Редактировать шаблон"
                            aria-label="Редактировать шаблон"
                          >
                            <FaPen />
                          </button>
                        )}
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          disabled={isDeletingTemplate}
                          title="Удалить шаблон"
                          aria-label="Удалить шаблон"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="muted empty-section">
                  {isTemplatesLoading
                    ? "Загрузка..."
                    : "Шаблонов пока нет. Создайте в редакторе."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="orders-section" id="orders">
        <div className="card-header">
          <h3>Ваши заказы</h3>
          {isOrdersLoading && <span className="muted">Загружаем...</span>}
          {isOrdersError && (
            <span className="error">Не удалось загрузить заказы.</span>
          )}
        </div>
        <div className="orders-grid">
          {orders && orders.length > 0 ? (
            orders.map((order) => (
              <div
                key={order.id}
                className="order-card"
                onClick={() => setActiveOrder(order)}
              >
                <div className="order-card__header">
                  <span className="order-number">#{order.id}</span>
                  <span className={`order-badge ${getOrderStatusClass(order.status)}`}>
                    {getOrderStatusText(order.status)}
                  </span>
                </div>
                <div className="order-card__body">
                  <div className="order-info">
                    <div className="order-info__item">
                      <span className="label">Сумма</span>
                      <span className="value">{formatRub(order.total_amount)}</span>
                    </div>
                    <div className="order-info__item">
                      <span className="label">Дата</span>
                      <span className="value">{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="order-card__footer">
                  <span className="view-details">Подробнее →</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              {isOrdersLoading ? "Загружаем..." : "Заказов пока нет."}
            </div>
          )}
        </div>
      </div>

      {activeOrder && (
        <div className="order-drawer">
          <div className="order-drawer__backdrop" onClick={() => setActiveOrder(null)} />
          <div className="order-drawer__panel">
          <div className="order-drawer__header">
            <h3>Заказ #{activeOrder.id}</h3>
            <button className="close-btn" onClick={() => setActiveOrder(null)}>
              ×
            </button>
          </div>
          <div className="order-drawer__meta">
            <div>
              <span className="muted">Статус</span>
              <strong className={getOrderStatusClass(activeOrder.status)}>
                {getOrderStatusText(activeOrder.status)}
              </strong>
            </div>
            <div>
              <span className="muted">Сумма</span>
              <strong>{formatRub(activeOrder?.total_amount)}</strong>
            </div>
            <div>
              <span className="muted">Создан</span>
              <strong>{formatDate(activeOrder.created_at)}</strong>
            </div>
          </div>
            <div className="order-drawer__items">
              <h4>Товары</h4>
              {activeOrder.items && activeOrder.items.length > 0 ? (
                activeOrder.items.map((item) => (
                  <div key={item.id} className="order-item">
                    <div>
                      <strong>{item.product?.type || "Товар"}</strong>
                      <div className="muted">
                        Размер: {item.product?.size || "-"}, Цвет:{" "}
                        {item.product?.color || "-"}
                      </div>
                    </div>
                    <div className="order-item__meta">
                      <span>Цена: {formatRub(item.amount)}</span>
                      <span>Кол-во: {item.quantity}</span>
                      {item.quantity > 1 && (
                        <span>Итого: {formatRub(item.amount * item.quantity)}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="muted">Пока без товаров.</div>
              )}
            </div>

          <div className="order-drawer__delivery" style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
              <h4 style={{ marginBottom: '12px', color: '#333' }}>Яндекс Доставка</h4>
              {activeOrder.yandex_request_id ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '14px' }}>Статус: <strong style={{ color: '#2e7d32' }}>{activeOrder.yandex_status || "Создан"}</strong></span>
                    <button
                      className="sync-status-btn"
                      onClick={() => syncDeliveryStatus(activeOrder.id)}
                      disabled={isSyncing}
                      style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', background: '#fff' }}
                    >
                      {isSyncing ? "Обновляем..." : "Обновить статус"}
                    </button>
                  </div>
                  {activeOrder.delivery_cost > 0 && (
                    <div className="delivery-price" style={{ fontSize: '14px', fontWeight: '500' }}>
                      Стоимость доставки: {formatRub(activeOrder.delivery_cost)}
                    </div>
                  )}
                  <div className="muted" style={{ fontSize: '11px', marginTop: '8px', color: '#888' }}>
                    ID заявки: {activeOrder.yandex_request_id}
                  </div>
                </>
              ) : (
                <div className="delivery-error-box" style={{ color: '#d32f2f', fontSize: '13px', background: '#fff1f0', padding: '12px', borderRadius: '6px', border: '1px solid #ffa39e' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '16px' }}>⚠️</span> Ошибка оформления
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', lineHeight: '1.5', background: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #ffccc7' }}>
                    {activeOrder.yandex_error || "Доставка через Яндекс не была выбрана или не удалось получить офферы."}
                  </div>
                  {activeOrder.yandex_error && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(activeOrder.yandex_error);
                      }}
                      style={{ 
                        marginTop: '10px', 
                        background: '#fff', 
                        border: '1px solid #d32f2f', 
                        color: '#d32f2f', 
                        padding: '4px 10px', 
                        borderRadius: '4px', 
                        cursor: 'pointer', 
                        fontSize: '11px',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#fff1f0'}
                      onMouseOut={(e) => e.target.style.background = '#fff'}
                    >
                      Скопировать текст ошибки для поддержки
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
