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
import Spinner from "react-bootstrap/Spinner";
import "./Home.css";

export default function Home() {
    const [notes, setNotes] = useState([]);
    const [filteredNotes, setFilteredNotes] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [greet, setGreet] = useState();
    const { isAuthenticated } = useAppContext();
    const [isLoading, setIsLoading] = useState(true);
    // const [isDeleting, setIsDeleting] = useState(false);

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

    async function handleDeleteAll() {
        const confirmed = window.confirm(
            "Are you sure you want to delete all your notes? This action cannot be undone."
        );
        if (!confirmed) return;
        try {
            await API.del("notes", "/notes");
            setNotes([]);
            setFilteredNotes([]);
            alert("All notes have been deleted.");
        } catch (e) {
            onError(e);
        }
    }

    function renderNotesList(notes) {
        return (
            <div className="notes-scroll-container">
                <div className="notes-row">
                    {notes.map(({ noteId, content, createdAt, attachment, userId }) => {
                        const safeContent = typeof content === "string" ? content : "No content available";
                        const safeAttachment = typeof attachment === "string" ? attachment : null;

                        const filePath = `private/${userId}/${safeAttachment}`;
                        const encodedKey = encodeURIComponent(filePath);
                        const imageUrl = `${BASE_URL}/${encodedKey}`;

                        return (
                            <div key={noteId} className="note-card">
                                {imageUrl && (
                                    <img
                                        src={imageUrl}
                                        alt={`Note ${safeContent.trim().split("\n")[0]}`}
                                        className="note-image"
                                        onError={(e) => (e.target.src = "/default-image.png")}
                                    />
                                )}
                                <div className="note-content">
                                    <span className="font-weight-bold">
                                        {safeContent.trim().split("\n")[0]}
                                    </span>
                                </div>
                                <div className="note-actions">
                                    <LinkContainer to={`/notes/${noteId}`}>
                                        <Button variant="primary" size="sm" className="mr-2">
                                            Show
                                        </Button>
                                    </LinkContainer>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDelete(noteId)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }



    async function handleDelete(noteId) {
        const confirmed = window.confirm("Are you sure you want to delete this note?");
        if (!confirmed) return;

        try {
            await API.del("notes", `/notes/${noteId}`);
            setNotes((prevNotes) => prevNotes.filter((note) => note.noteId !== noteId));
            setFilteredNotes((prevNotes) => prevNotes.filter((note) => note.noteId !== noteId));
            alert("Note deleted successfully.");
        } catch (e) {
            onError(e);
        }
    }



    function renderLander() {
        return (
            <div className="lander">
                <h1 className="lander-title">Welcome to NoteApp</h1>
                <p className="lander-description text-muted">
                    A simple, efficient, and secure note-taking application to organize your ideas.
                </p>
                <div className="box d-flex justify-content-center">
                    <LinkContainer to="/signup">
                        <Button variant="success" size="lg" className="mr-3">
                            Sign Up
                        </Button>
                    </LinkContainer>
                    <LinkContainer to="/login">
                        <Button variant="primary" size="lg">
                            Log In
                        </Button>
                    </LinkContainer>
                </div>
                <div className="feature-section mt-5">
                    <h3>Why NoteApp?</h3>
                    <ul className="feature-list">
                        <li>📋 Simple and intuitive note-taking experience</li>
                        <li>🔒 Secure storage with end-to-end encryption</li>
                        <li>🌐 Access your notes anywhere, anytime</li>
                        <li>🚀 Get started in just seconds!</li>
                    </ul>
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
                <Form className="mb-3 d-flex w-100 align-items-center">
                    <Form.Control
                        type="text"
                        placeholder="Search notes..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="search-input"
                    />
                    <div className="d-flex w-50 align-items-center ">
                        <LinkContainer to="/notes/new" className="flex-grow-1">
                            <ListGroup.Item action className="create-note-button">
                                <BsPencilSquare size={17} />
                                <span className="ml-2">Create Note</span>
                            </ListGroup.Item>
                        </LinkContainer>
                        <ListGroup.Item
                            action
                            className="delete-all-button flex-grow-1"
                            onClick={handleDeleteAll}
                        >
                            Delete All Notes
                        </ListGroup.Item>
                    </div>
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
