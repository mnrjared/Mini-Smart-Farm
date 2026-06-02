interface ChickenKPIProps {
    text: string;
    kpiValue: number | string;
}

function ChickenKPI({ text, kpiValue }: ChickenKPIProps) {
    return(
        <article className="summary">
            <p className="summary-text">{text}</p>
            <p className="summary-number" id="chicken-count">
                {kpiValue}
            </p>
        </article>
    );
}

export default ChickenKPI;