import { useAuth } from "../contexts/AuthContext";

export default function LogoutPage() {

  
  const { signOutUser, loading, user } = useAuth();

  const signOutWithRedirect = async () => {
    try {
      await signOutUser();
    } finally {
      window.location.href = window.location.href.replace("logout", "login");
    }
  };

  if (loading) {
    return (
      <div className="container flex flex-col gap-10 items-center justify-center min-h-screen">
        <div><h1 className="login-title">GameTime Assigning<br />Availability Form</h1></div>
        <div className="card w-full max-w-md p-8">
          <h1 className="text-2xl font-semibold mb-4 text-center">Logout</h1>
          <p>Signing in...</p>
          <button className="btn" style={{maxHeight: "3rem"}} onClick={signOutWithRedirect}>Force Sign Out</button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container flex flex-col gap-10 items-center justify-center min-h-screen">
        <div><h1 className="login-title">GameTime Assigning<br />Availability Form</h1></div>
        <div className="card w-full max-w-md p-8">
          <h1 className="text-2xl font-semibold mb-4 text-center">Logout</h1>
          <p>Already Signed Out</p>
          <button className="btn" style={{maxHeight: "3rem"}} onClick={signOutWithRedirect}>Sign Out Anyways</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex flex-col gap-10 items-center justify-center min-h-screen">
      <div><h1 className="login-title">GameTime Assigning<br />Availability Form</h1></div>
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold mb-4 text-center">Logout</h1>
        <p>Would you like to sign out?</p>
        <button className="btn" style={{maxHeight: "3rem"}} onClick={signOutWithRedirect}>Sign Out</button>
      </div>
    </div>
  );

}
