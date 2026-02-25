import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './CustomTooltip.module.scss';

const CustomTooltip = ({ content, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const timeoutRef = useRef(null);

    const showTooltip = () => {
        timeoutRef.current = setTimeout(() => {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setPosition({
                    top: rect.top,
                    left: rect.left + rect.width / 2,
                });
                setIsVisible(true);
            }
        }, 300); // 0.3s delay
    };

    const hideTooltip = () => {
        clearTimeout(timeoutRef.current);
        setIsVisible(false);
    };

    useEffect(() => {
        return () => clearTimeout(timeoutRef.current);
    }, []);

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
                onFocus={showTooltip}
                onBlur={hideTooltip}
                style={{ display: 'inline-flex' }}
            >
                {children}
            </div>
            {isVisible && createPortal(
                <div
                    className={`${styles.tooltip} ${isVisible ? styles.visible : ''}`}
                    style={{ top: position.top, left: position.left }}
                >
                    {content}
                </div>,
                document.body
            )}
        </>
    );
};

export default CustomTooltip;
