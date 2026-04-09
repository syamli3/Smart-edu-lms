import UniversalUserForm from "@/components/auth/UniversalUserForm";
import { GraduationCap } from "lucide-react";
import { Link } from "react-router";

const Register = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-[#3ecf8e] p-1.5 rounded-lg">
              <GraduationCap className="text-black w-8 h-8" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              EDU<span className="text-[#3ecf8e]">NEXUS</span>
            </span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Apply for Admission
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-[#3ecf8e] hover:text-[#34b27b]"
          >
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white dark:bg-[#1c1c1c] py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-200 dark:border-gray-800">
          <UniversalUserForm type="create" role="student" />
        </div>
      </div>
    </div>
  );
};

export default Register;
