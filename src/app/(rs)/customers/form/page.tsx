import { getCustomer } from "@/lib/queries/getCustomer";
import { BackButton } from "@/components/BackButton";
import * as Sentry from "@sentry/nextjs"
import CustomerForm from "@/app/(rs)/customers/form/CustomerForm";
import { auth } from "@clerk/nextjs/server";

export async function generateMetadata({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    const { customerId } = await searchParams

    if (!customerId) return { title: "New Customer" }

    return { title: `Edit Customer #${customerId}` }
}

export default async function CustomerFormPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    try {
        const { sessionClaims } = auth()
        const publicRole =
            (sessionClaims?.publicMetadata as { role?: string } | undefined)?.
                role
        const isManager = publicRole === "manager" || sessionClaims?.orgRole === "manager"

        const { customerId } = await searchParams

        // Edit customer form 
        if (customerId) {
            const customer = await getCustomer(parseInt(customerId))

            if (!customer) {
                return (
                    <>
                        <h2 className="text-2xl mb-2">Customer ID #{customerId} not found</h2>
                        <BackButton title="Go Back" variant="default" />
                    </>
                )
            }
            // put customer form component
            return <CustomerForm key={customerId} isManager={isManager} customer={customer} />
        } else {
            // new customer form component
            return <CustomerForm key="new" isManager={isManager} />
        }

    } catch (e) {
        if (e instanceof Error) {
            Sentry.captureException(e)
            throw e
        }
    }
}