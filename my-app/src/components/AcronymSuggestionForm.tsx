import React, { useState } from 'react';

interface AcronymSuggestionFormProps {
  onSubmit: (acronym: string, expansion: string, context: string) => void;
  onCancel: () => void;
}

export const AcronymSuggestionForm: React.FC<AcronymSuggestionFormProps> = ({ onSubmit, onCancel }) => {
  const [acronym, setAcronym] = useState('');
  const [expansion, setExpansion] = useState('');
  const [context, setContext] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(acronym, expansion, context);
  };

  return (
    <form onSubmit={handleSubmit} className="acronym-suggestion-form">
      <h2>Suggest New Acronym</h2>
      <input
        type="text"
        value={acronym}
        onChange={(e) => setAcronym(e.target.value)}
        placeholder="Acronym"
        required
      />
      <input
        type="text"
        value={expansion}
        onChange={(e) => setExpansion(e.target.value)}
        placeholder="Expansion"
        required
      />
      <input
        type="text"
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Context (optional)"
      />
      <div className="form-buttons">
        <button type="submit">Submit</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};