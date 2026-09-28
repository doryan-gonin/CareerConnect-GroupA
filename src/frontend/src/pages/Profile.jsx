import { useEffect, useState } from 'react'
const userId = 1

function Profile(){

    document.title = "Profile Page"

    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')

    async function handleSave() {

        const profile = {
            first_name: firstName,
            last_name: lastName
        }

        console.log('Profile sent:', profile)

        try {
            const response = await fetch(`http://localhost:8000/api/profiles/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile)
            })

            if (!response.ok) {
                throw new Error(`Save failed: ${response.status}`)
            }

            const savedProfile = await response.json()
            console.log('Profile returned:', savedProfile)

            alert('Profile saved!')
        } catch (error) {
            console.error(error)
            alert('Could not save profile.')
        }
    }

    useEffect(() => {
        async function loadProfile() {
            try {
                const response = await fetch(`http://localhost:8000/api/profiles/${userId}`)

                if (!response.ok) {
                    throw new Error(`Load failed: ${response.status}`)
                }

                const profile = await response.json()
                console.log('GET response:', profile)
                setFirstName(profile.first_name)
                setLastName(profile.last_name)
            } catch (error) {
                console.error(error)
            }
        }

        loadProfile()
    }, [])

    return (
        <div>
            <h1>My Profile</h1>
            <label htmlFor="firstName">First Name: </label>
            <input id="firstName" type="text" value={firstName} onChange={(event) => setFirstName(event.target.value)}/>
            <label htmlFor="lastName">Last Name: </label>
            <input id="lastName" type="text" value={lastName} onChange={(event) => setLastName(event.target.value)}/>
            <button type="button" onClick={handleSave}>Save</button>
        </div>
    )
}

export default Profile