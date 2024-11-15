import React, { useEffect, useState } from "react";

import { Field, Form, Formik } from "formik";
import { Link as RouterLink, useHistory } from "react-router-dom";
import { toast } from "react-toastify";
import * as Yup from "yup";

import {
	Box,
	Button,
	Container,
	CssBaseline,
	Grid,
	IconButton,
	InputAdornment,
	Link,
	TextField,
	Typography
} from '@material-ui/core';

import { Visibility, VisibilityOff } from '@material-ui/icons';

import { makeStyles } from "@material-ui/core/styles";

import { i18n } from "../../translate/i18n";

import defaultLogo from '../../assets/logo.jpg';
import toastError from "../../errors/toastError";
import api from "../../services/api";

const PUBLIC_ASSET_PATH = '/assets/';

const Copyright = ({ companyName, companyUrl }) => {
	return (
		<Typography variant="body2" color="textSecondary" align="center">
			© {new Date().getFullYear()}
			{" - "}
			<Link color="inherit" href={companyUrl || "https://github.com/rtenorioh/Press-Ticket"}>
				{companyName || "Press Ticket"}
			</Link>
			{"."}
		</Typography>
	);
};

const useStyles = makeStyles(theme => ({
	paper: {
		marginTop: theme.spacing(8),
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
	},
	form: {
		width: "100%",
		marginTop: theme.spacing(3),
	},
	submit: {
		margin: theme.spacing(3, 0, 2),
	},
}));

const UserSchema = Yup.object().shape({
	name: Yup.string()
		.min(2, "Too Short!")
		.max(50, "Too Long!")
		.required("Required"),
	password: Yup.string().min(5, "Too Short!").max(50, "Too Long!"),
	email: Yup.string().email("Invalid email").required("Required"),
});

const SignUp = () => {
	const classes = useStyles();
	const history = useHistory();
	const initialState = { name: "", email: "", password: "" };
	const [showPassword, setShowPassword] = useState(false);
	const [user] = useState(initialState);
	const [theme, setTheme] = useState("light");
	const [companyData, setCompanyData] = useState({
		logo: defaultLogo,
		name: "Press Ticket",
		url: "https://github.com/rtenorioh/Press-Ticket"
	});

	useEffect(() => {
		const fetchCompanyData = async () => {
			try {
				const { data } = await api.get("/personalizations");

				if (data && data.length > 0) {

					const lightConfig = data.find(themeConfig => themeConfig.theme === "light");

					if (lightConfig) {
						setCompanyData(prevData => ({
							...prevData,
							name: lightConfig.company || "Press Ticket",
							url: lightConfig.url || "https://github.com/rtenorioh/Press-Ticket"
						}));
					}
				}
			} catch (err) {
				toastError(err);
			}
		};

		const savedTheme = localStorage.getItem("theme") || "light";
		setTheme(savedTheme);

		fetchCompanyData();
	}, []);

	useEffect(() => {
		const fetchLogo = async () => {
			try {
				const { data } = await api.get("/personalizations");

				if (data && data.length > 0) {
					const lightConfig = data.find(themeConfig => themeConfig.theme === "light");
					const darkConfig = data.find(themeConfig => themeConfig.theme === "dark");

					if (theme === "light" && lightConfig && lightConfig.logo) {
						setCompanyData(prevData => ({
							...prevData,
							logo: PUBLIC_ASSET_PATH + lightConfig.logo
						}));
					} else if (theme === "dark" && darkConfig && darkConfig.logo) {
						setCompanyData(prevData => ({
							...prevData,
							logo: PUBLIC_ASSET_PATH + darkConfig.logo
						}));
					} else {
						setCompanyData(prevData => ({
							...prevData,
							logo: defaultLogo
						}));
					}
				}

			} catch (err) {
				toastError(err);
			}
		};

		fetchLogo();
	}, [theme]);

	const handleSignUp = async values => {
		try {
			await api.post("/auth/signup", values);
			toast.success(i18n.t("signup.toasts.success"));
			history.push("/login");
		} catch (err) {
			toastError(err);
		}
	};

	return (
		<Container component="main" maxWidth="xs">
			<CssBaseline />
			<div className={classes.paper}>
				<img alt="logo" src={companyData.logo} style={{ height: 120, marginBottom: 20 }} />
				<Typography component="h1" variant="h5">
					{i18n.t("signup.title")}
				</Typography>
				<Formik
					initialValues={user}
					enableReinitialize={true}
					validationSchema={UserSchema}
					onSubmit={(values, actions) => {
						setTimeout(() => {
							handleSignUp(values);
							actions.setSubmitting(false);
						}, 400);
					}}
				>
					{({ touched, errors, isSubmitting }) => (
						<Form className={classes.form}>
							<Grid container spacing={2}>
								<Grid item xs={12}>
									<Field
										as={TextField}
										autoComplete="name"
										name="name"
										error={touched.name && Boolean(errors.name)}
										helperText={touched.name && errors.name}
										variant="outlined"
										fullWidth
										id="name"
										label={i18n.t("signup.form.name")}
										autoFocus
									/>
								</Grid>

								<Grid item xs={12}>
									<Field
										as={TextField}
										variant="outlined"
										fullWidth
										id="email"
										label={i18n.t("signup.form.email")}
										name="email"
										error={touched.email && Boolean(errors.email)}
										helperText={touched.email && errors.email}
										autoComplete="email"
									/>
								</Grid>
								<Grid item xs={12}>
									<Field
										as={TextField}
										variant="outlined"
										fullWidth
										name="password"
										id="password"
										autoComplete="current-password"
										error={touched.password && Boolean(errors.password)}
										helperText={touched.password && errors.password}
										label={i18n.t("signup.form.password")}
										type={showPassword ? 'text' : 'password'}
										InputProps={{
											endAdornment: (
												<InputAdornment position="end">
													<IconButton
														aria-label="toggle password visibility"
														onClick={() => setShowPassword((e) => !e)}
													>
														{showPassword ? <VisibilityOff color="secondary" /> : <Visibility color="secondary" />}
													</IconButton>
												</InputAdornment>
											)
										}}
									/>
								</Grid>
							</Grid>
							<Button
								type="submit"
								fullWidth
								variant="contained"
								color="primary"
								className={classes.submit}
							>
								{i18n.t("signup.buttons.submit")}
							</Button>
							<Grid container justifyContent="flex-end">
								<Grid item>
									<Link
										href="#"
										variant="body2"
										component={RouterLink}
										to="/login"
									>
										{i18n.t("signup.buttons.login")}
									</Link>
								</Grid>
							</Grid>
						</Form>
					)}
				</Formik>
			</div>
			<Box mt={5}><Copyright companyName={companyData.name} companyUrl={companyData.url} /></Box>
		</Container>
	);
};

export default SignUp;
