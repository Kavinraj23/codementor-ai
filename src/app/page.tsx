import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-12 md:mb-20">
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              {/* <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div> */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight">
                CodeMentor
              </h1>
            </div>
            {/* <div className="text-center">
              <span className="text-lg md:text-xl font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                Powered by AI
              </span>
            </div> */}
          </div>
          <p className="text-lg md:text-xl lg:text-2xl font-medium text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed px-4">
            Master coding interviews with AI-powered practice and instant feedback.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-20">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-lg md:hover:shadow-xl md:hover:scale-105 transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="text-blue-600 mb-4 md:mb-6">
              <svg className="w-12 h-12 md:w-14 md:h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                <circle cx="12" cy="8" r="1" fill="currentColor" />
                <circle cx="10" cy="10" r="0.5" fill="currentColor" />
                <circle cx="14" cy="10" r="0.5" fill="currentColor" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.6} d="M9 14h6" stroke="currentColor" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-gray-900 dark:text-white">
              AI-Powered Interviews
            </h3>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              Practice with an AI interviewer that adapts to your skill level and provides personalized guidance.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-lg md:hover:shadow-xl md:hover:scale-105 transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="text-blue-600 mb-4 md:mb-6">
              <svg className="w-12 h-12 md:w-14 md:h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 7h1m0 0h1m-1 0V6m0 1v1" />
                <circle cx="19" cy="8" r="3" fill="currentColor" stroke="white" strokeWidth={1} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M17.5 8l.5.5L19.5 7" stroke="white" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-gray-900 dark:text-white">
              Detailed Scoring
            </h3>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              Get comprehensive feedback on correctness, efficiency, code style, and communication skills.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-lg md:hover:shadow-xl md:hover:scale-105 transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="text-blue-600 mb-4 md:mb-6">
              <svg className="w-12 h-12 md:w-14 md:h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 21h18M3 21V3" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 19l4-4 4 2 6-6" />
                <circle cx="5" cy="19" r="1.5" fill="currentColor" />
                <circle cx="9" cy="15" r="1.5" fill="currentColor" />
                <circle cx="13" cy="17" r="1.5" fill="currentColor" />
                <circle cx="19" cy="11" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-gray-900 dark:text-white">
              Track Progress
            </h3>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              Monitor your improvement over time with detailed session history and performance analytics.
            </p>
          </div>
        </div>

        <div className="text-center rounded-xl md:rounded-2xl p-6 md:p-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white mb-4 md:mb-6 tracking-tight">
            Ready to ace your next interview?
          </h2>
          <p className="text-base md:text-lg lg:text-xl font-medium text-gray-600 dark:text-gray-300 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
            Join thousands of developers who have improved their coding interview skills with CodeMentor AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/problem-select"
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 md:py-4 lg:py-5 md:px-8 lg:px-12 rounded-lg md:rounded-xl transition-all duration-300 shadow-lg md:shadow-xl hover:shadow-xl md:hover:shadow-2xl md:hover:scale-105 text-base md:text-lg lg:text-xl"
            >
              Start Your First Interview
              <svg className="w-4 h-4 md:w-5 md:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
              </svg>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold py-3 px-6 md:py-4 lg:py-5 md:px-8 lg:px-12 rounded-lg md:rounded-xl transition-all duration-300 shadow-lg md:shadow-xl hover:shadow-xl md:hover:shadow-2xl md:hover:scale-105 text-base md:text-lg lg:text-xl border-2 border-gray-200 dark:border-gray-600"
            >
              View Dashboard
              <svg className="w-4 h-4 md:w-5 md:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
