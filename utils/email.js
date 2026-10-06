import nodemailer from "nodemailer";

const getEmailProvider = () =>
	(process.env.EMAIL_PROVIDER || (process.env.SENDGRID_API_KEY ? "sendgrid" : "smtp"))
		.trim()
		.toLowerCase();

export const isPasswordResetEmailConfigured = () => {
	const provider = getEmailProvider();
	if (provider === "sendgrid") {
		return Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL);
	}
	return Boolean(
		(process.env.SMTP_HOST || provider === "brevo") &&
		process.env.SMTP_USER &&
		process.env.SMTP_PASSWORD &&
		(process.env.SMTP_FROM || process.env.SMTP_USER),
	);
};

export const sendPasswordResetEmail = async (email, code) => {
	const provider = getEmailProvider();
	const usingSendGrid = provider === "sendgrid";
	const port = Number(process.env.SMTP_PORT || 587);

	const transporter = nodemailer.createTransport({
		host: usingSendGrid
			? "smtp.sendgrid.net"
			: process.env.SMTP_HOST || (provider === "brevo" ? "smtp-relay.brevo.com" : undefined),
		port,
		secure: port === 465,
		auth: {
			user: usingSendGrid ? "apikey" : process.env.SMTP_USER,
			pass: usingSendGrid ? process.env.SENDGRID_API_KEY : process.env.SMTP_PASSWORD,
		},
	});

	await transporter.sendMail({
		from: usingSendGrid
			? process.env.SENDGRID_FROM_EMAIL
			: process.env.SMTP_FROM || process.env.SMTP_USER,
		to: email,
		subject: "Reset your Polli password",
		text: `Your Polli password reset code is ${code}. Enter it in the app within 10 minutes. If you did not request this code, you can ignore this email.`,
		html: `<p>Your Polli password reset code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>Enter it in the app within 10 minutes. If you did not request this code, you can ignore this email.</p>`,
	});
};
