import RefereeConfirmation from "./referee-confirmation";

export default async function Page ({ params }: { params: Promise<{ token: string }>  }) { 
    const { token } = await params

    return (
        <RefereeConfirmation token={token} />
    )
}
