import React, { useState, useEffect } from "react";
import ListGroup from "react-bootstrap/ListGroup";
import { useAppContext } from "../libs/contextLib";
import { onError } from "../libs/errorLib";
import { Auth } from "aws-amplify";
import { BsPencilSquare } from "react-icons/bs";
import { LinkContainer } from "react-router-bootstrap";
import { API } from "aws-amplify";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner"; // For loading spinner
import "./Home.css";

export default function Home() {
    const [notes, setNotes] = useState([]);
    const [filteredNotes, setFilteredNotes] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [greet, setGreet] = useState();
    const { isAuthenticated } = useAppContext();
    const [isLoading, setIsLoading] = useState(true);

    const BASE_URL = "https://notes-api-uploads.s3.us-east-1.amazonaws.com";

    useEffect(() => {
        async function onLoad() {
            if (!isAuthenticated) {
                return;
            }
            try {
                const notes = await loadNotes();
                const user = await Auth.currentAuthenticatedUser();
                const { attributes } = user;
                setGreet(attributes.email);
                setNotes(notes);
                setFilteredNotes(notes);
            } catch (e) {
                onError(e);
            }
            setIsLoading(false);
        }
        onLoad();
    }, [isAuthenticated]);

    async function loadNotes() {
        return await API.get("notes", "/notes");
    }

    function handleSearch(event) {
        const term = event.target.value.toLowerCase();
        setSearchTerm(term);

        setFilteredNotes(
            notes.filter((note) =>
                note.content.toLowerCase().includes(term) ||
                (note.attachment && typeof note.attachment === "string" && note.attachment.toLowerCase().includes(term))
            )
        );
    }

    function renderNotesList(notes) {
        return (
            <>
                <LinkContainer to="/notes/new">
                    <ListGroup.Item action className="py-3 text-nowrap text-truncate">
                        <BsPencilSquare size={17} />
                        <span className="ml-2 font-weight-bold">Create a new note</span>
                    </ListGroup.Item>
                </LinkContainer>
                {notes.map(({ noteId, content, createdAt, attachment, userId }) => {
                    const safeContent = typeof content === "string" ? content : "No content available";
                    const safeAttachment = typeof attachment === "string" ? attachment : null;

                    const filePath = `private/${userId}/${safeAttachment}`;
                    const encodedKey = encodeURIComponent(filePath);
                    const imageUrl = `${BASE_URL}/${encodedKey}`;

                    return (
                        <LinkContainer key={noteId} to={`/notes/${noteId}`}>
                            <ListGroup.Item action className="d-flex align-items-center">
                                {/* Display the image if it exists */}
                                {imageUrl && (
                                    <img
                                        src={imageUrl}
                                        alt={`Note ${safeContent.trim().split("\n")[0]}`}
                                        className="note-image"
                                        onError={(e) => (e.target.src = "/default-image.png")}
                                    />
                                )}
                                <div>
                                    <span className="font-weight-bold">
                                        {safeContent.trim().split("\n")[0]}
                                    </span>
                                    <br />
                                    <span className="text-muted">
                                        Created: {new Date(createdAt).toLocaleString()}
                                    </span>
                                </div>
                            </ListGroup.Item>
                        </LinkContainer>
                    );
                })}
            </>
        );
    }

    function renderLander() {
        return (
            <div className="lander">
                <h1>NoteApp</h1>
                <p className="text-muted">A simple note-taking app</p>
                <div className="box">
                    <LinkContainer to="/signup">
                        <Button variant="success">Sign up</Button>
                    </LinkContainer>
                    <LinkContainer to="/login">
                        <Button className="ml-4" variant="primary">Login</Button>
                    </LinkContainer>
                </div>
            </div>
        );
    }

    function renderNotes() {
        return (
            <div className="notes">
                <h2>
                    Welcome, <span>{greet}</span>
                </h2>
                <h2 className="pb-3 mt-4 mb-3 border-bottom">Your Notes</h2>
                <Form className="mb-3">
                    <Form.Control
                        type="text"
                        placeholder="Search notes..."
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </Form>
                {isLoading ? (
                    <div className="text-center">
                        <Spinner animation="border" />
                        <p>Loading notes...</p>
                    </div>
                ) : (
                    <ListGroup>{renderNotesList(filteredNotes)}</ListGroup>
                )}
            </div>
        );
    }

    return (
        <div className="Home">
            {isAuthenticated ? renderNotes() : renderLander()}
        </div>
    );
}
