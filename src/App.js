import React, { useState, useEffect } from "react";
import "./App.css";

import { listNotes } from "./graphql/queries";
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
} from "./graphql/mutations";
import { onCreateNote, onDeleteNote } from "./graphql/subscriptions";

import { API, Storage, graphqlOperation, Auth } from "aws-amplify";
import { withAuthenticator, AmplifySignOut } from "@aws-amplify/ui-react";

const initialFormState = { name: "", description: "" };

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [userEmail, setUserEmail] = useState("");
  useEffect(() => {
    Auth.currentUserInfo()
      .then((data) => setUserEmail(data.attributes.email))
      .catch((error) => console.log("userEmail error: ", error));
    fetchNotes();
    // Auth.currentCredentials().then((data) =>
    //   console.log("currentCredentials", data)
    // );
    // Auth.currentAuthenticatedUser().then((data) =>
    //   console.log("currentAuthenticatedUser: ", data)
    // );

    var onCreateNoteSubscription, onDeleteNoteSubscription;

    Auth.currentAuthenticatedUser().then((user) => {
      onCreateNoteSubscription = API.graphql({
        query: onCreateNote,
        variables: { owner: user.username },
      }).subscribe({
        next: (noteData) => {
          console.log("onCreateNoteSubscription", noteData);
          fetchNotes();
        },
        error: (error) => {
          console.log("onCreateNoteSubscription error", error);
        },
      });
      onDeleteNoteSubscription = API.graphql({
        query: onDeleteNote,
        variables: { owner: user.username },
      }).subscribe({
        next: (noteData) => {
          console.log("onDeleteNoteSubscription", noteData);
          fetchNotes();
        },
        error: (error) => {
          console.log("onDeleteNoteSubscription error", error);
        },
      });
    });

    return () => {
      if (onCreateNoteSubscription) {
        onCreateNoteSubscription.unsubscribe();
      }
      if (onDeleteNoteSubscription) {
        onDeleteNoteSubscription.unsubscribe();
      }
    };
  }, []);

  async function onChange(e) {
    if (!e.target.files[0]) return;
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const image = await Storage.get(note.image);
          note.image = image;
        }
        return note;
      })
    );
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({
      query: createNoteMutation,
      variables: { input: formData },
    });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([...notes, formData]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter((note) => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }

  return (
    <div className="App">
      <h1>My Notes App</h1>
      <h2>{"USER: " + userEmail}</h2>
      <input
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Note name"
        value={formData.name}
        data-test="noteNameInput"
      />
      <input
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        placeholder="Note description"
        value={formData.description}
        data-test="noteDescriptionInput"
      />
      <input type="file" onChange={onChange} />
      <button onClick={createNote} data-test="createNoteButton">
        Create Note
      </button>
      <div style={{ marginBottom: 30 }}>
        {notes.map((note) => (
          <div key={note.id || note.name}>
            <h2>{note.name}</h2>
            <p>{note.description}</p>
            <button onClick={() => deleteNote(note)}>Delete note</button>
            {note.image && <img src={note.image} style={{ width: 400 }} />}
          </div>
        ))}
      </div>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);
