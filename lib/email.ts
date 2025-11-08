import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendAppointmentConfirmation = async ({
    to,
    name,
    date,
    time,
}: {
    to: string;
    name: string;
    date: string;
    time: string;
}) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Curanova <appointments@curanova.com>',
            to: [to],
            subject: 'Your Appointment is Confirmed',
            html: `
        <h1>Appointment Confirmation</h1>
        <p>Dear ${name},</p>
        <p>Your appointment has been confirmed for:</p>
        <p>Date: ${date}</p>
        <p>Time: ${time}</p>
        <p>Thank you for choosing Curanova!</p>
      `,
        });

        if (error) {
            throw error;
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
    }
};

export const sendDiagnosticResults = async ({
    to,
    name,
    diagnosisType,
    result,
}: {
    to: string;
    name: string;
    diagnosisType: string;
    result: any;
}) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Curanova <diagnostics@curanova.com>',
            to: [to],
            subject: `Your ${diagnosisType} Results`,
            html: `
        <h1>Diagnostic Results</h1>
        <p>Dear ${name},</p>
        <p>Your ${diagnosisType} results are ready:</p>
        <pre>${JSON.stringify(result, null, 2)}</pre>
        <p>Please consult with your healthcare provider about these results.</p>
      `,
        });

        if (error) {
            throw error;
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
    }
};