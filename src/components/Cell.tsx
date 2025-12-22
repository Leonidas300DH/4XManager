import React from 'react';
import './Cell.css';

interface CellProps {
    value: number | string;
    onChange?: (value: number) => void;
    readOnly?: boolean;
    type?: 'text' | 'number';
    className?: string;
    min?: number;
    max?: number;
    isExpense?: boolean;
    renderContent?: (value: number | string) => React.ReactNode;
}

export const Cell: React.FC<CellProps> = ({
    value,
    onChange,
    readOnly = false,
    type = 'number',
    className = '',
    min,
    max,
    isExpense = false,
    renderContent
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            const val = parseFloat(e.target.value);
            onChange(isNaN(val) ? 0 : val);
        }
    };

    const isNegative = typeof value === 'number' && value < 0;
    const displayValue = value === 0 ? '' : value;

    return (
        <div className={`cell-container ${className} ${isNegative ? 'negative-cell' : ''}`}>
            {readOnly ? (
                <span className={`cell-value ${isExpense ? 'expense-input' : ''}`}>
                    {renderContent ? renderContent(value) : value}
                </span>
            ) : (
                <input
                    type={type}
                    value={displayValue}
                    placeholder="0"
                    onChange={handleChange}
                    className={`cell-input ${isExpense ? 'expense-input' : ''}`}
                    min={min}
                    max={max}
                />
            )}
        </div>
    );
};
