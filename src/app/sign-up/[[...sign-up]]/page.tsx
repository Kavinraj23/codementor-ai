import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Join Codementor AI
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Start your coding interview journey today
          </p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors",
              card: "bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-100 dark:border-gray-700",
              headerTitle: "text-xl font-bold text-gray-900 dark:text-white",
              headerSubtitle: "text-gray-600 dark:text-gray-400",
              socialButtonsBlockButton: "bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors",
              dividerLine: "bg-gray-300 dark:bg-gray-600",
              dividerText: "text-gray-500 dark:text-gray-400",
              formFieldLabel: "text-gray-700 dark:text-gray-300 font-medium",
              formFieldInput: "border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 rounded-lg",
              footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
            }
          }}
        />
      </div>
    </div>
  );
}
