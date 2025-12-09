import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const handleOverview = () => navigate("/overview");
  const handleAdvanced = () => navigate("/advanced");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#242424] text-white">
      <main
        role="main"
        aria-label="Main controls"
        className="flex flex-col items-center gap-6 p-6 rounded-xl backdrop-blur-sm"
      >
        <h1 className="m-0 text-lg font-semibold">BTSpeculation</h1>

        <div className="flex gap-3">
          <button
            onClick={handleOverview}
            className="min-w-[120px] px-5 py-2 rounded-lg font-semibold border border-white/12 bg-transparent transform transition duration-150 hover:-translate-y-1"
          >
            Overview
          </button>

          <button
            onClick={handleAdvanced}
            className="min-w-[120px] px-5 py-2 rounded-lg font-semibold border border-white/14 bg-white/6 transform transition duration-150 hover:-translate-y-1"
          >
            Advanced
          </button>
        </div>
      </main>
    </div>
  );
}

export default Home;
