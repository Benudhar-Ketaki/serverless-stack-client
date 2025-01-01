import React, { useRef, useState } from "react";
import Form from "react-bootstrap/Form";
import { useHistory } from "react-router-dom";
import { API } from "aws-amplify";
import LoaderButton from "../components/LoaderButton";
import { onError } from "../libs/errorLib";
import config from "../config";
import "./NewNote.css";

// Function to convert a file to base64
function encodeFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result.split(",")[1]); // Extract base64 part from result
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function NewNote() {
    const file = useRef(null);
    const history = useHistory();
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    function validateForm() {
        return content.length > 0;
    }

    function handleFileChange(event) {
        file.current = event.target.files[0];
    }

    async function handleSubmit(event) {
        event.preventDefault();

        // Validate file size
        if (file.current && file.current.size > config.MAX_ATTACHMENT_SIZE) {
            alert(
                `Please pick a file smaller than ${config.MAX_ATTACHMENT_SIZE / 1000000
                } MB.`
            );
            return;
        }

        setIsLoading(true);

        try {
            // If a file is selected, encode it to base64
            const attachment = file.current ? await encodeFileToBase64(file.current) : null;

            // Create note with base64-encoded file (if attached)
            const note = {
                content,
                attachment: attachment
                    ? {
                        name: file.current.name,
                        content: attachment, // base64-encoded content
                        contentType: file.current.type,
                    }
                    : null,
            };

            // Send the note to the API
            await createNote(note);
            history.push("/"); // Redirect to the home page
        } catch (e) {
            onError(e);
            setIsLoading(false);
        }
    }

    function createNote(note) {
        return API.post("notes", "/notes", {
            body: note,
        });
    }

    return (
        <div className="NewNote">
            <Form onSubmit={handleSubmit}>
                <Form.Group controlId="content">
                    <Form.Control
                        value={content}
                        as="textarea"
                        onChange={(e) => setContent(e.target.value)}
                    />
                </Form.Group>
                <Form.Group controlId="file">
                    <Form.Label>Attachment</Form.Label>
                    <Form.Control onChange={handleFileChange} type="file" />
                </Form.Group>
                <LoaderButton
                    block
                    type="submit"
                    size="lg"
                    variant="primary"
                    isLoading={isLoading}
                    disabled={!validateForm()}
                >
                    Create
                </LoaderButton>
            </Form>
        </div>
    );
}