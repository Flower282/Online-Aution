export default function ChristmasSnowflakes() {
    return (
        <div className="snowflakes-container">
            {[...Array(10)].map((_, i) => (
                <div key={i} className="snowflake">
                    ❄
                </div>
            ))}
        </div>
    );
}

