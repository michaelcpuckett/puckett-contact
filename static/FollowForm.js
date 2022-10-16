const formElement = window.document.querySelector('#FollowForm');
formElement?.addEventListener('submit', (event) => {
  event.preventDefault();
  let formElements = [];

  for (const element of [...formElement.elements]) {
    if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
      formElements.push(element);
    }
  }
  const body = Object.fromEntries(formElements.map(formElement => [
    formElement.getAttribute('name'),
    formElement.value,
  ]));

  const createNoteActivity = {
    '@context': 'https://www.w3.org/ns/activitystreams#',
    type: 'Follow',
    actor: body.actor,
    to: [
      'https://www.w3.org/ns/activitystreams#Public',
      `${body.actor}/followers`,
      body.object,
    ],
    object: body.object,
  };

  fetch(formElement.getAttribute('action'), {
    method: 'POST',
    headers: {
      'Accept': 'application/activity+json',
    },
    body: JSON.stringify(createNoteActivity),
  })
  .then(response => {
    if (response.status === 201 && response.headers.get('Location')) {
      window.location.reload();
    }
  });
});