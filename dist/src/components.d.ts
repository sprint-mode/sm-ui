import { default as React, ReactNode, CSSProperties } from 'react';
export interface CardProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
    accent?: string;
}
export declare function Card({ children, className, style, accent }: CardProps): React.JSX.Element;
export interface CardBodyProps {
    children?: ReactNode;
    style?: CSSProperties;
}
export declare function CardBody({ children, style }: CardBodyProps): React.JSX.Element;
export interface PillProps {
    children?: ReactNode;
    color?: string;
    style?: CSSProperties;
}
export declare function Pill({ children, color, style }: PillProps): React.JSX.Element;
export interface BadgeProps {
    children?: ReactNode;
    color?: string;
    style?: CSSProperties;
}
export declare function Badge({ children, color, style }: BadgeProps): React.JSX.Element;
export interface ButtonProps {
    children?: ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'lg';
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
    style?: CSSProperties;
    href?: string;
    type?: 'button' | 'submit' | 'reset';
}
export declare function Button({ children, variant, size, onClick, disabled, style, href, type }: ButtonProps): React.JSX.Element;
export interface StatCardProps {
    label: ReactNode;
    value: ReactNode;
    sub?: ReactNode;
    valueColor?: string;
    valueSize?: string | number;
}
export declare function StatCard({ label, value, sub, valueColor, valueSize }: StatCardProps): React.JSX.Element;
export interface StatsProps {
    children?: ReactNode;
}
export declare function Stats({ children }: StatsProps): React.JSX.Element;
export interface ProgressProps {
    value?: number;
    color?: string;
}
export declare function Progress({ value, color }: ProgressProps): React.JSX.Element;
export interface TabItem {
    key: string;
    label: ReactNode;
}
export interface TabsProps {
    tabs: TabItem[];
    active: string;
    onChange: (key: string) => void;
}
export declare function Tabs({ tabs, active, onChange }: TabsProps): React.JSX.Element;
export interface PageHeaderProps {
    breadcrumb?: ReactNode;
    breadcrumbProduct?: string;
    title: ReactNode;
    subtitle?: ReactNode;
    children?: ReactNode;
}
export declare function PageHeader({ breadcrumb, breadcrumbProduct, title, subtitle, children }: PageHeaderProps): React.JSX.Element;
export interface TableHeader {
    key?: string;
    label?: string;
    align?: 'left' | 'right' | 'center';
}
export interface TableRow {
    key?: string | number;
    cells: ReactNode[];
    sortValues?: (string | number | null | undefined)[];
}
export interface TableProps {
    headers: (string | TableHeader)[];
    rows: TableRow[];
    empty?: ReactNode;
    onRowClick?: (row: TableRow, index: number) => void;
    sortable?: boolean;
}
export declare function Table({ headers, rows, empty, onRowClick, sortable }: TableProps): React.JSX.Element;
export interface EmptyProps {
    icon?: ReactNode;
    title?: ReactNode;
    message?: ReactNode;
}
export declare function Empty({ icon, title, message }: EmptyProps): React.JSX.Element;
export declare function Spinner(): React.JSX.Element;
export interface ScoreRingProps {
    score?: number;
    label?: string;
}
export declare function ScoreRing({ score, label }: ScoreRingProps): React.JSX.Element;
export interface ExplainerProps {
    children?: ReactNode;
    title?: string;
}
export declare function Explainer({ children, title }: ExplainerProps): React.FunctionComponentElement<React.FragmentProps>;
export interface DataTableHeader {
    key: string;
    label: string;
    width?: number;
    numeric?: boolean;
}
export interface DataTableRow {
    key?: string | number;
    cells: ReactNode[];
    sortValues?: (string | number | null | undefined)[];
}
export interface DataTableProps {
    headers: DataTableHeader[];
    rows: DataTableRow[];
    columnPicker?: boolean;
    storageKey?: string | null;
    onRowClick?: (row: DataTableRow, index: number) => void;
    empty?: ReactNode;
    sortable?: boolean;
}
export declare function DataTable(props: DataTableProps): React.JSX.Element;
export interface MultiSelectOption {
    id: string;
    name: string;
}
export interface MultiSelectProps {
    label?: string;
    options?: MultiSelectOption[];
    selected?: string[];
    onChange?: (selected: string[]) => void;
    width?: number | string;
    placeholder?: string;
    className?: string;
}
export declare function MultiSelect(props: MultiSelectProps): React.DetailedReactHTMLElement<{
    ref: React.RefObject<HTMLDivElement | null>;
    className: string;
    style: {
        position: "relative";
        display: "inline-block";
    };
}, HTMLDivElement>;
