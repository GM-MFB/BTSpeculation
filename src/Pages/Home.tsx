function Home() {
    return (
        <div>
            <h1 className="text-4xl flex justify-center mt-20">
                {import.meta.env.VITE_SITE_NAME}
            </h1>
        </div>
    );
}

export default Home;
