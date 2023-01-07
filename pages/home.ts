const createFormElement = window.document.querySelector('#create-form');
createFormElement.addEventListener('submit', (event) => {
  event.preventDefault();

  const actorIdElement = createFormElement.querySelector<HTMLInputElement>('input[name="actor-id"]');
  const actorOutboxIdElement = createFormElement.querySelector<HTMLInputElement>('input[name="actor-outbox-id"]');
  const actorFollowersIdElement = createFormElement.querySelector<HTMLInputElement>('input[name="actor-followers-id"]');
  const contentElement = createFormElement.querySelector<HTMLTextAreaElement>('textarea[name="content"]');
  
  const actorId = actorIdElement.value;
  const actorOutboxId = actorOutboxIdElement.value;
  const actorFollowersId = actorFollowersIdElement.value;
  const content = contentElement.value;

  fetch(actorOutboxId, {
    method: 'POST',
    body: JSON.stringify({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Create',
      actor: actorId,
      to: [
        'https://www.w3.org/ns/activitystreams#Public',
        actorFollowersId,
      ],
      object: {
        type: 'Note',
        content,
      },
    }),
  })
  .then((res) => {
    if (res.headers.get('Location')) {
      window.location.reload();
    } else {
      console.log(res);
    }
  })
  .catch((error) => {
    console.log(error);
  });
});
