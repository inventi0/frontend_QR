import React from "react";
import {
    FaPaintBrush,
    FaImage,
    FaEye,
    FaEyeSlash,
    FaChevronUp,
    FaChevronDown,
    FaTrashAlt,
    FaPlus,
    FaTimes,
} from "react-icons/fa";
import styles from "./LayersPanel.module.scss";

function LayersPanel({
    layers,
    activeLayerId,
    activePaintLayerId,
    onSelectLayer,
    onMoveLayer,
    onDeleteLayer,
    onToggleVisibility,
    onAddPaintLayer,
    onClose,
}) {
    // Display topmost layer first
    const reversed = [...layers].reverse();

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <span className={styles.title}>Слои</span>
                <button className={styles.closeBtn} onClick={onClose} title="Закрыть">
                    <FaTimes />
                </button>
            </div>

            <div className={styles.list}>
                {reversed.map((layer) => {
                    const isActive = layer.id === activeLayerId;
                    const isActivePaint = layer.id === activePaintLayerId;

                    return (
                        <div
                            key={layer.id}
                            className={`${styles.row} ${isActive ? styles.active : ""} ${isActivePaint ? styles.paintTarget : ""}`}
                            onClick={() => onSelectLayer(layer.id)}
                        >
                            <span className={styles.typeIcon}>
                                {layer.type === "paint" ? <FaPaintBrush /> : <FaImage />}
                            </span>
                            <span className={styles.name}>{layer.name}</span>

                            <div className={styles.actions}>
                                <button
                                    className={styles.iconBtn}
                                    onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                                    title={layer.visible ? "Скрыть" : "Показать"}
                                >
                                    {layer.visible ? <FaEye /> : <FaEyeSlash />}
                                </button>
                                <button
                                    className={styles.iconBtn}
                                    onClick={(e) => { e.stopPropagation(); onMoveLayer(layer.id, "up"); }}
                                    title="Вверх"
                                >
                                    <FaChevronUp />
                                </button>
                                <button
                                    className={styles.iconBtn}
                                    onClick={(e) => { e.stopPropagation(); onMoveLayer(layer.id, "down"); }}
                                    title="Вниз"
                                >
                                    <FaChevronDown />
                                </button>
                                <button
                                    className={`${styles.iconBtn} ${styles.deleteBtn}`}
                                    onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id); }}
                                    title="Удалить слой"
                                >
                                    <FaTrashAlt />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.footer}>
                <button className={styles.addBtn} onClick={onAddPaintLayer}>
                    <FaPlus /> Слой
                </button>
            </div>
        </div>
    );
}

export default React.memo(LayersPanel);
