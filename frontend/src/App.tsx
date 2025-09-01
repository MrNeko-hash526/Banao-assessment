
import Signup from "./AuthPages/Signup";
import Login from "./AuthPages/Login";
import { Provider } from "./components/ui/provider";
import { ToastProvider } from "./components/ui/toast";
import DocDash from "./dashboards/DocDash";
import PatientDash from "./dashboards/PatientDash";

const App = () => {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  let content = <Signup />;
  if (path === '/signup') content = <Signup />;
  if (path === '/login') content = <Login />;
  if (path === '/doctor-dashboard') content = <DocDash />;
  if (path === '/patient-dashboard') content = <PatientDash />;

  return (
    <Provider>
      <ToastProvider>
        {content}
      </ToastProvider>
    </Provider>
  );
};

export default App;
