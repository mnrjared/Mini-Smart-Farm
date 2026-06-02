interface GraphContainerProps {
    containerID: string;
    title: string;
    child: React.ReactNode;
    chartID: string;
}
function GraphContainer({ containerID, title, child, chartID }: GraphContainerProps) {
    return(
        <article id = {containerID} className = "chart-section">
            <h2 className = "graph-title">{title}</h2>
            <hr className = "graph-hr"/>
            <div id={chartID}>{child}</div>

        </article>
    )
}
export default GraphContainer;