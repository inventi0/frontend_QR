import React, { useMemo, useState } from "react";
import "./ProfilePage.scss";
import { useGetMeQuery } from "../api/authApi";
import {
  useGetUserQrQuery,
  useListOrdersQuery,
  useListMyOrdersQuery,
  useListUserTemplatesQuery,
  useSetQrTemplateMutation,
} from "../api/accountApi";
import Copy from "../components/icons/Copy";
import EyePasswordShow from "../components/icons/EyePasswordShow";
import { useNavigate } from "react-router-dom";

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const ProfilePage = () => {
  const { data: me, isLoading: isMeLoading, isError: isMeError } =
    useGetMeQuery();
  const navigate = useNavigate();

  const userId = me?.id;
  const email = me?.email;

  const {
    data: qrData,
    isLoading: isQrLoading,
    isError: isQrError,
    refetch: refetchQr,
  } = useGetUserQrQuery(userId, { skip: !userId });

  const {
    data: templates,
    isLoading: isTemplatesLoading,
    isError: isTemplatesError,
  } = useListUserTemplatesQuery(
    { userId, includeGlobal: true, limit: 50, offset: 0 },
    { skip: !userId }
  );

  const {
    data: orders,
    isLoading: isOrdersLoading,
    isError: isOrdersError,
  } = useListMyOrdersQuery({ limit: 20, offset: 0 }, { skip: !userId });

  const [setQrTemplate, { isLoading: isSettingTemplate }] =
    useSetQrTemplateMutation();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [copyState, setCopyState] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [activeOrder, setActiveOrder] = useState(null);

  const handleCopy = (value) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopyState(true);
    setTimeout(() => setCopyState(false), 700);
  };

  const templateOptions = useMemo(() => {
    if (!templates) return [];
    return templates.map((tpl) => ({
      label: tpl.name || `Шаблон #${tpl.id}`,
      id: tpl.id,
    }));
  }, [templates]);

  const handleTemplateChange = async () => {
    if (!selectedTemplate) return;
    try {
      setTemplateError("");
      await setQrTemplate({ template_id: selectedTemplate }).unwrap();
      refetchQr();
    } catch (err) {
      const detail = err?.data?.detail;
      setTemplateError(
        (typeof detail === "string" && detail) ||
          err?.error ||
          "Не удалось обновить шаблон."
      );
    }
  };

  const openEditor = (templateUrl, qrId) => {
    navigate("/creator", { state: { templateUrl, qrId } });
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

  const avatar =
    me.img_url ||
    "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/Avatar.png";
  const currentTemplateParam = qrData?.current_template_file_url
    ? `?template=${encodeURIComponent(qrData.current_template_file_url)}`
    : "";
  const qrLink = qrData?.editor_url
    ? `${qrData.editor_url}/creator${currentTemplateParam}`
    : qrData?.editor_url || null;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-info">
          <img src={avatar} alt={me.username} className="avatar" />
          <div>
            <h1>{me.username || me.email}</h1>
            <p>{me.email}</p>
          </div>
        </div>
        <div className="profile-actions">
          <button className="copy-btn" onClick={() => handleCopy(me.id)}>
            <Copy />
            {copyState ? "Скопировано" : `User ID: ${me.id}`}
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="qr-card">
          <div className="card-header">
            <h3>Ваш QR</h3>
            {isQrLoading && <span className="muted">Обновляем...</span>}
            {isQrError && (
              <span className="error">Не удалось загрузить QR.</span>
            )}
          </div>
          {qrData ? (
            <div className="qr-body">
              <div className="qr-image">
                {qrData.qr_image_url ? (
                  <a
                    href={qrLink || qrData.qr_image_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img src={qrData.qr_image_url} alt="QR" />
                  </a>
                ) : (
                  <div className="qr-placeholder">QR без изображения</div>
                )}
              </div>
              <div className="qr-meta">
                {/* <div className="meta-row">
                  <span>Code</span>
                  <button onClick={() => handleCopy(qrData.code)}>
                    <Copy /> {copyState ? "Скопировано" : qrData.code}
                  </button>
                </div> */}
              <div className="meta-row">
                <span>Editor URL</span>
                <a href={`${qrData.editor_url}/creator${currentTemplateParam}`} target="_blank" rel="noreferrer">
                  Открыть редактор
                </a>
              </div>
              <div className="meta-row">
                <span>Текущий шаблон</span>
                <span>
                  {qrData.current_template_id
                    ? `#${qrData.current_template_id}`
                    : "Не выбран"}
                </span>
              </div>
              {qrData.current_template_file_url && (
                <div className="meta-row">
                  <button
                    className="apply-btn"
                    onClick={() =>
                      openEditor(qrData.current_template_file_url, qrData.qr_id)
                    }
                  >
                    Открыть прикреплённый шаблон
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="muted">QR ещё не создан.</div>
        )}

          <div className="template-picker">
            <label>Сменить шаблон</label>
            <div className="picker-row">
              <select
                value={selectedTemplate || ""}
                onChange={(e) => setSelectedTemplate(Number(e.target.value))}
                disabled={!templateOptions.length || isSettingTemplate}
              >
                <option value="" disabled>
                  {isTemplatesLoading
                    ? "Загружаем шаблоны..."
                    : "Выберите шаблон"}
                </option>
                {templateOptions.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.label}
                  </option>
                ))}
              </select>
              <button
                className="apply-btn"
                onClick={handleTemplateChange}
                disabled={!selectedTemplate || isSettingTemplate}
              >
                {isSettingTemplate ? "Применяем..." : "Применить"}
              </button>
            </div>
            {templateError && <div className="error">{templateError}</div>}
            {isTemplatesError && (
              <div className="error">Не удалось загрузить шаблоны.</div>
            )}
          </div>
        </div>

        <div className="templates-card">
          <div className="card-header">
            <h3>Ваши шаблоны</h3>
            {isTemplatesLoading && <span className="muted">Загружаем...</span>}
          </div>
          <div className="templates-list">
            {templates && templates.length > 0 ? (
              templates.map((tpl) => (
                <div key={tpl.id} className="template-item">
                  <div className="template-thumb">
                    {tpl.file_url ? (
                      <img src={tpl.file_url} alt={tpl.name || `Шаблон #${tpl.id}`} />
                    ) : (
                      <div className="template-placeholder">Нет превью</div>
                    )}
                  </div>
                  <div className="template-content">
                    <h4>{tpl.name || `Шаблон #${tpl.id}`}</h4>
                    {tpl.description && (
                      <p className="muted">{tpl.description}</p>
                    )}
                    <div className="template-meta">
                      <span className="muted">ID: {tpl.id}</span>
                      {tpl.file_url && (
                        <button
                          className="apply-btn secondary"
                          onClick={() => openEditor(tpl.file_url, qrData?.qr_id)}
                        >
                          Открыть
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="muted empty-section">
                {isTemplatesLoading
                  ? "Загрузка..."
                  : "Шаблонов пока нет. Создайте в редакторе."}
                <button
                  className="apply-btn secondary"
                  onClick={() => openEditor(null, qrData?.qr_id)}
                >
                  Создать шаблон
                </button>
              </div>
            )}
            <button
              className="add-template-btn"
              onClick={() => openEditor(null, qrData?.qr_id)}
            >
              + Добавить шаблон
            </button>
          </div>
        </div>
      </div>

      <div className="orders-card">
        <div className="card-header">
          <h3>Ваши заказы</h3>
          {isOrdersLoading && <span className="muted">Загружаем...</span>}
          {isOrdersError && (
            <span className="error">Не удалось загрузить заказы.</span>
          )}
        </div>
      <div className="orders-table">
        {orders && orders.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Номер заказа</th>
                <th>Статус</th>
                <th>Сумма</th>
                <th>Создан</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setActiveOrder(order)}
                  className="order-row"
                >
                  <td>{order.id}</td>
                  <td className="status">{order.status}</td>
                  <td>{order.total_amount}₽</td>
                  <td>{formatDate(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="muted">
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
              <strong>{activeOrder.status}</strong>
            </div>
            <div>
              <span className="muted">Сумма</span>
              <strong>{activeOrder.total_amount}₽</strong>
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
                    <span>Кол-во: {item.quantity}</span>
                    <span>Цена: {item.amount}₽</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="muted">Пока без товаров.</div>
            )}
          </div>
        </div>
      </div>
    )}
    </div>
  );
};
