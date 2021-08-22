package com.projects.finn.ui.activities;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import com.projects.finn.R;
import com.projects.finn.config.FirebaseConfig;
import com.projects.finn.utils.Checkers;
import com.facebook.AccessToken;
import com.facebook.CallbackManager;
import com.facebook.FacebookCallback;
import com.facebook.FacebookException;
import com.facebook.appevents.AppEventsLogger;
import com.facebook.login.LoginResult;
import com.facebook.login.widget.LoginButton;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.SignInButton;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.AuthResult;
import com.google.firebase.auth.FacebookAuthProvider;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException;
import com.google.firebase.auth.FirebaseAuthInvalidUserException;
import com.google.firebase.auth.GoogleAuthProvider;

public class AuthActivity extends AppCompatActivity {
    private TextView redirectRegister;
    private TextView forgotPassButton;
    private EditText loginEmail, loginPassword;
    private Button loginButton;
    private Button fbFakeButton;
    private SignInButton googleSignInButton;
    private FirebaseAuth auth;
    private GoogleSignInClient mGoogleSignInClient;
    private LoginButton fbLoginButton;
    private CallbackManager callbackManager;
    private final static int RC_SIGN_IN = 123;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_auth);

        initializeComponents();
        createGoogleRequest();
        createFacebookRequest();
        setClickListeners();
    }

    public void initializeComponents() {
        redirectRegister = findViewById(R.id.redirectRegister);
        loginEmail = findViewById(R.id.loginEmail);
        loginPassword = findViewById(R.id.loginPassword);
        loginButton = findViewById(R.id.loginButton);
        forgotPassButton = findViewById(R.id.forgot_pass_button);
        googleSignInButton = findViewById(R.id.google_sign_in_button);
        googleSignInButton.setSize(SignInButton.SIZE_WIDE);
        fbLoginButton = findViewById(R.id.facebook_sign_in_button);
        fbLoginButton.setPermissions("email", "public_profile");
        fbFakeButton = findViewById(R.id.fb_fake_button);
        auth = FirebaseConfig.getFirebaseAuth();
        callbackManager = CallbackManager.Factory.create();
    }

    public void setClickListeners() {
        loginButton.setOnClickListener(v -> authenticateUser());

        googleSignInButton.setOnClickListener(v -> {
            Intent signInIntent = mGoogleSignInClient.getSignInIntent();
            startActivityForResult(signInIntent, RC_SIGN_IN);
        });

        fbFakeButton.setOnClickListener(v -> fbLoginButton.performClick());

        redirectRegister.setOnClickListener(v -> startActivity(new Intent(AuthActivity.this, RegisterActivity.class)));

        forgotPassButton.setOnClickListener(v -> startActivity(new Intent(AuthActivity.this, ForgotPassActivity.class)));
    }

    public void authenticateUser() {
        String email = loginEmail.getText().toString();
        String password = loginPassword.getText().toString();
        if(email.isEmpty()) {
            Toast.makeText(this, "Please enter your e-mail", Toast.LENGTH_SHORT).show();
            return;
        }
        if(!Checkers.isEmailValid(email)) {
            Toast.makeText(this, "The given email is invalid", Toast.LENGTH_SHORT).show();
            return;
        }
        if(password.isEmpty()) {
            Toast.makeText(this, "Please enter your password", Toast.LENGTH_SHORT).show();
            return;
        }
        auth.signInWithEmailAndPassword(email, password)
            .addOnCompleteListener(this, task -> {
                if(task.isSuccessful()) {
                    mainPageRedirect();
                } else {
                    String exception = "";
                    try {
                        throw task.getException();
                    } catch (FirebaseAuthInvalidUserException e) {
                        exception = "This user is not registered";
                    } catch (FirebaseAuthInvalidCredentialsException e) {
                        exception = "The password is incorrect";
                    } catch (Exception e) {
                        exception = "Error " +e.getMessage();
                        e.printStackTrace();
                    }
                    Toast.makeText(AuthActivity.this, "Error" + exception, Toast.LENGTH_SHORT).show();
                }
            });
    }

    public void createGoogleRequest() {
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .build();
        mGoogleSignInClient = GoogleSignIn.getClient(this, gso);
    }

    public void createFacebookRequest() {
        AppEventsLogger.activateApp(getApplication());
        fbLoginButton.registerCallback(callbackManager, new FacebookCallback<LoginResult>() {
            @Override
            public void onSuccess(LoginResult loginResult) {
                handleFacebookAccessToken(loginResult.getAccessToken());
            }
            @Override
            public void onCancel() {
                // App code
            }
            @Override
            public void onError(FacebookException exception) {
                // App code
            }
        });
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        // Result returned from launching the Intent from GoogleSignInApi.getSignInIntent(...);
        if (requestCode == RC_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            try {
                // Google Sign In was successful, authenticate with Firebase
                GoogleSignInAccount account = task.getResult(ApiException.class);
                handleGoogleAccessToken(account.getIdToken());
            } catch (ApiException e) {
                Toast.makeText(this, e.getMessage(), Toast.LENGTH_SHORT).show();
                // Google Sign In failed, update UI appropriately
            }
        } else {
            callbackManager.onActivityResult(requestCode, resultCode, data);
        }
    }

    private void handleGoogleAccessToken(String idToken) {
        AuthCredential credential = GoogleAuthProvider.getCredential(idToken, null);
        auth.signInWithCredential(credential)
            .addOnCompleteListener(this, task -> {
                if (task.isSuccessful()) {
                    mainPageRedirect();
                } else {
                    Log.d("Google Auth", "User couldn't log in");
                }
            });
    }

    public void handleFacebookAccessToken(AccessToken token) {
        AuthCredential credential = FacebookAuthProvider.getCredential(token.getToken());
        auth.signInWithCredential(credential)
                .addOnCompleteListener(this, task -> {
                    if(task.isSuccessful()) {
                        mainPageRedirect();
                    } else {
                        Log.d("Facebook Auth", "User couldn't log in");
                    }
                });
    }

    public void mainPageRedirect() {
        startActivity(new Intent(this, MainPageActivity.class));
        finish();
    }
}