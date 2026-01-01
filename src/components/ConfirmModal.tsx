import React from 'react';
import './ConfirmModal.css';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDanger?: boolean;
    onExtraAction?: () => void;
    extraActionText?: string;
    extraActionClass?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'CONFIRM',
    cancelText = 'CANCEL',
    onConfirm,
    onCancel,
    isDanger = false,
    onExtraAction,
    extraActionText,
    extraActionClass = ''
}) => {
    if (!isOpen) return null;

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className={`confirm-content ${isDanger ? 'danger' : 'warning'}`} onClick={e => e.stopPropagation()}>
                <div className="confirm-header">
                    <div className="warning-icon">
                        {isDanger ? '⚠️' : '⚡'}
                    </div>
                    <h3>{title}</h3>
                </div>

                <div className="confirm-body">
                    <p>{message}</p>
                </div>

                <div className="confirm-footer">
                    <button className="confirm-btn cancel" onClick={onCancel}>
                        {cancelText}
                    </button>

                    {onExtraAction && extraActionText && (
                        <button className={`confirm-btn extra ${extraActionClass}`} onClick={onExtraAction}>
                            {extraActionText}
                        </button>
                    )}

                    <button className="confirm-btn action" onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>

                {/* Decorative Elements */}
                <div className="corner top-left"></div>
                <div className="corner top-right"></div>
                <div className="corner bottom-left"></div>
                <div className="corner bottom-right"></div>
                <div className="scanline"></div>
            </div>
        </div>
    );
};
