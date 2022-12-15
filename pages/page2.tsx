import React from 'react'
import Link from "next/link"

const page2 = () => {
    return (
        <div>
            <h1>page2</h1>
            <Link href="/persons">back to persons</Link>
        </div>
    )
}

export default page2;