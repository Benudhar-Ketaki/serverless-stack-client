import React, { useState } from "react";
import { Auth } from "aws-amplify";
import { useHistory } from "react-router-dom";
import LoaderButton from "../components/LoaderButton";
import { useAppContext } from "../libs/contextLib";
import { useFormFields } from "../libs/hooksLib";
import { onError } from "../libs/errorLib";
import { Link } from "react-router-dom";
import "./LoginSignup.css";

export default function LoginSignup() {
    const [isLoginActive, setIsLoginActive] = useState(true);
    const toggleView = () => setIsLoginActive((prev) => !prev);
    const history = useHistory();
    const { userHasAuthenticated } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [fields, handleFieldChange] = useFormFields({
        email: "",
        password: ""
    });

    function validateForm() {
        return fields.email.length > 0 && fields.password.length > 0;
    }
    async function handleLoginSubmit(event) {
        event.preventDefault();
        setIsLoading(true);
        try {
            await Auth.signIn(fields.email, fields.password);
            userHasAuthenticated(true)
            history.push("/");
        } catch (e) {
            onError(e);
            setIsLoading(false);
        }
    }

    return (
        <div className="login-signup-container">
            <div
                className={`form-container ${isLoginActive ? "login-active" : "signup-active"}`}
            >
                <div className="form-content">
                    {isLoginActive ? (
                        <>
                            <h1>Login</h1>
                            <form onSubmit={handleLoginSubmit}>
                                <input autoFocus
                                    type="email"
                                    value={fields.email}
                                    onChange={handleFieldChange} placeholder="Email" required />
                                <input type="password"
                                    value={fields.password}
                                    onChange={handleFieldChange} placeholder="Password" required />
                                <LoaderButton
                                    block
                                    size="lg"
                                    type="submit"
                                    isLoading={isLoading}
                                    disabled={!validateForm()}
                                >
                                    Login
                                </LoaderButton>
                            </form>
                            <p>
                                Forgot password? <Link to="/forget">Click here</Link>
                            </p>
                        </>
                    ) : (
                        <>
                            <h1>Signup</h1>
                            <form>
                                <input type="email" placeholder="Email" required />
                                <input type="password" placeholder="Password" required />
                                <input type="password" placeholder="Confirm Password" required />
                                <button type="submit">Signup</button>
                            </form>
                        </>
                    )}
                </div>
                <button className="toggle-button" onClick={toggleView}>
                     {isLoginActive ? "Resister Now" : "Already Resistered"}
                </button>
            </div>
        </div>
    );
}
