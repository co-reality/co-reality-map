<H1> Folder structure(Pages, Components, Templates, Organisms, Molecules, Atoms) </H1>
We should stick to one way of organizing our folder and component's structure.
Utils have files with .tsx file extension, which I think is inappropriate.
We have validation.js and wdyr.js files at the top level of src

<H1> Styles </H1>
Currently we both use Styled-Components and scss across our codebase. I think we should stick to one and remove the other

<H1> Data fetching & selectors in components </H1>
We have a lot of ambiguity about how we interact with data in our app.
For example:

- `useConnects` in components with different ways of solving the issue, when there is no needed data(like a venue id)
- firestore direct pushes in `actions` and components

<H1> Merging flow </H1>
We should have a well-defined merging flow to avoid misunderstandings.

<H1> Branch and commit naming </H1>
Well-defined rules for this can help keep everything tidy and understandable by all parties

<H1> Merging vs rebasing </H1>

<H1> Casing for different types of files(Service, Component, Util functions, Styles, Types) </H1>
We have different casings for the same file types. For example:

- types/utility
- types/forms
- types/Role
- types/Question

<H1> Not related \ unused files and folders should be removed </H1>

---

<H3> Replace js with ts. At least `src` folder should not contain js files </H3>

---

<H3> Proper loading and error logic across the app. Preferably happening somewhere in a data layer, so that you don't manage it in every component </H3>

---

<H1> With all the modals and other UI modules, we should think of the most efficient way of how to design them. Maybe we should store their in redux? </H1>

<H1>Assets (Icons, Images, default avatars...) </H1>
There are images all accross the project. Some of them are in component directories, others are in public folder. We should unify them and keep it simple in one place easy to add / remove. Also we should clean up the unnecessary ones.

<H1>Component structure</H1>
I think we should have a component structure and convention. Ex:

- _variables_
- _hooks_
- _functions_
- _render / return_

render structure: Ex:

- _renderMethod()_ or `<MiniComponent />`
