// import React, { useRef, useState, useEffect } from "react";
// import { useParams, useHistory } from "react-router-dom";
// import { API, Storage } from "aws-amplify";
// import { onError } from "../libs/errorLib";
// import Form from "react-bootstrap/Form";
// import LoaderButton from "../components/LoaderButton";
// import config from "../config";
// import { s3Upload } from "../libs/awsLib";
// import "./Notes.css";

// export default function Notes() {
//     const file = useRef(null);
//     const { id } = useParams();
//     const history = useHistory();
//     const [note, setNote] = useState(null);
//     const [content, setContent] = useState("");
//     const [isLoading, setIsLoading] = useState(false);
//     const [isDeleting, setIsDeleting] = useState(false);
//     useEffect(() => {
//         function loadNote() {
//             return API.get("notes", `/notes/${id}`);
//         }
//         async function onLoad() {
//             try {
//                 const note = await loadNote();
//                 const { content, attachment } = note;
//                 if (attachment) {
//                     note.attachmentURL = await Storage.vault.get(attachment);
//                 }
//                 setContent(content);
//                 setNote(note);
//             } catch (e) {
//                 onError(e);
//             }
//         }
//         onLoad();
//     }, [id]);

//     function validateForm() {
//         return content.length > 0;
//     }

//     function formatFilename(str) {
//         if (typeof str === "string") {
//             return str.replace(/^\w+-/, "");
//         }
//         return "Unknown file";
//     }

//     function handleFileChange(event) {
//         file.current = event.target.files[0];
//     }

//     function saveNote(note) {
//         return API.put("notes", `/notes/${id}`, {
//             body: note
//         });
//     }
//     async function handleSubmit(event) {
//         let attachment;
//         event.preventDefault();
//         if (file.current && file.current.size > config.MAX_ATTACHMENT_SIZE) {
//             alert(
//                 `Please pick a file smaller than ${config.MAX_ATTACHMENT_SIZE / 1000000
//                 } MB.`
//             );
//             return;
//         }
//         setIsLoading(true);
//         try {
//             if (file.current) {
//                 attachment = await s3Upload(file.current);
//             }
//             await saveNote({
//                 content,
//                 attachment: attachment || note.attachment
//             });
//             history.push("/");
//         } catch (e) {
//             onError(e);
//             setIsLoading(false);
//         }
//     }

//     function deleteNote() {
//         return API.del("notes", `/notes/${id}`);
//     }
//     async function handleDelete(event) {
//         event.preventDefault();
//         const confirmed = window.confirm(
//             "Are you sure you want to delete this note?"
//         );
//         if (!confirmed) {
//             return;
//         }
//         setIsDeleting(true);
//         try {
//             await deleteNote();
//             history.push("/");
//         } catch (e) {
//             onError(e);
//             setIsDeleting(false);
//         }
//     }

//     return (
//         <div className="Notes">
//             {note && (
//                 <Form onSubmit={handleSubmit}>
//                     <Form.Group controlId="content">
//                         <Form.Control
//                             as="textarea"
//                             value={content}
//                             onChange={(e) => setContent(e.target.value)}
//                         />
//                     </Form.Group>
//                     <Form.Group controlId="file">
//                         <Form.Label>Attachment :</Form.Label>
//                         {note.attachment && (
//                             <p>
//                                 <a
//                                     target="_blank"
//                                     rel="noopener noreferrer"
//                                     href={note.attachmentURL}
//                                 >
//                                     {formatFilename(note.attachment)}
//                                 </a>
//                             </p>
//                         )}
//                         {/* Form.Control */}
//                         <input onChange={handleFileChange} type="file" />
//                     </Form.Group>
//                     <LoaderButton
//                         block
//                         size="lg"
//                         type="submit"
//                         isLoading={isLoading}
//                         disabled={!validateForm()}
//                     >
//                         Save
//                     </LoaderButton>
//                     <LoaderButton
//                         block
//                         size="lg"
//                         variant="danger"
//                         onClick={handleDelete}
//                         isLoading={isDeleting}
//                     >
//                         Delete
//                     </LoaderButton>
//                 </Form>
//             )}
//         </div>
//     );
// }


import React, { useRef, useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import { API, Storage } from "aws-amplify";
import { onError } from "../libs/errorLib";
import LoaderButton from "../components/LoaderButton";
import { s3Upload } from "../libs/awsLib";
import config from "../config";
import Form from "react-bootstrap/Form"; // Ensure this import is present
import "./Notes.css";

export default function Notes() {
    const file = useRef(null);
    const { id } = useParams();
    const history = useHistory();
    const [note, setNote] = useState(null);
    const [content, setContent] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function onLoad() {
            try {
                const fetchedNote = await API.get("notes", `/notes/${id}`);
                const { content, attachment } = fetchedNote;

                if (attachment) {
                    fetchedNote.attachmentURL = await Storage.vault.get(attachment);
                }

                setContent(content);
                setNote(fetchedNote);
            } catch (e) {
                onError(e);
            }
        }
        onLoad();
    }, [id]);

    function validateForm() {
        return content.length > 0;
    }

    function handleFileChange(event) {
        file.current = event.target.files[0];
    }

    async function handleSubmit(event) {
        event.preventDefault();

        let attachment;

        if (file.current && file.current.size > config.MAX_ATTACHMENT_SIZE) {
            alert(
                `Please pick a file smaller than ${config.MAX_ATTACHMENT_SIZE / 1000000
                } MB.`
            );
            return;
        }

        setIsLoading(true);

        try {
            if (file.current) {
                attachment = await s3Upload(file.current);
            }

            await API.put("notes", `/notes/${id}`, {
                body: {
                    content,
                    attachment: attachment || note.attachment,
                },
            });

            setIsEditing(false);
            history.push("/");
        } catch (e) {
            onError(e);
            setIsLoading(false);
        }
    }

    function renderNoteView() {
        return (
            <div className="note-view">
                <div className="note-view-card">
                <h1 className="note-title">{content.split("\n")[0]}</h1>
                    {note.attachmentURL && (
                        <img
                            src={note.attachmentURL}
                            alt="Note attachment"
                            className="note-image-large"
                        />
                    )}
                    <div className="note-view-content">

                        <LoaderButton
                            size="lg"
                            onClick={() => setIsEditing(true)}
                            className="edit-button mt-3"
                        >
                            Edit
                        </LoaderButton>
                    </div>
                </div>
            </div>
        );
    }



    function renderEditForm() {
        return (
            <Form onSubmit={handleSubmit}>
                <Form.Group controlId="content">
                    <Form.Label>Note Content</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                </Form.Group>
                <Form.Group controlId="file">
                    <Form.Label>Attachment</Form.Label>
                    {note.attachment && (
                        <p>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href={note.attachmentURL}
                            >
                                {note.attachment}
                            </a>
                        </p>
                    )}
                    <input type="file" onChange={handleFileChange} />
                </Form.Group>
                <LoaderButton
                    block
                    size="lg"
                    type="submit"
                    isLoading={isLoading}
                    disabled={!validateForm()}
                >
                    Save
                </LoaderButton>
                <LoaderButton
                    block
                    size="lg"
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                    className="mt-2"
                >
                    Cancel
                </LoaderButton>
            </Form>
        );
    }

    return (
        <div className="Notes">
            {note ? (
                isEditing ? renderEditForm() : renderNoteView()
            ) : (
                <p>Loading note...</p>
            )}
        </div>
    );
}
