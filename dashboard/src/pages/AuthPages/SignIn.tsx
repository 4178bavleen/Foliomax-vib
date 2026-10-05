import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Foliomax"
        description="Foliomax is a trading wesbsite"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
