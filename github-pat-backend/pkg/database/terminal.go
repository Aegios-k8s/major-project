package database

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
)

// GenerateTerminalToken generates a random token for connecting the terminal
func GenerateTerminalToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// CreateConfigCredential saves an initial placeholder for the config file and returns the token
func CreateConfigCredential(orgID string, contextName string) (string, error) {
	token, err := GenerateTerminalToken()
	if err != nil {
		return "", err
	}

	_, err = DB.Exec(
		`INSERT INTO config_credentials (org_id, context_name, config_file, token) VALUES ($1, $2, $3, $4)`,
		orgID, contextName, "", token,
	)

	if err != nil {
		return "", err
	}

	return token, nil
}

// UpdateConfigCredential saves the actual uploaded config file
func UpdateConfigCredential(token string, configFile string) error {
	res, err := DB.Exec(
		`UPDATE config_credentials SET config_file = $1 WHERE token = $2`,
		configFile, token,
	)
	if err != nil {
		return err
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("no config_credential found for token %s", token)
	}

	return nil
}

// GetConfigCredential fetches the config string from the DB
func GetConfigCredential(token string) (string, error) {
	var configFile string
	err := DB.QueryRow(
		`SELECT config_file FROM config_credentials WHERE token = $1`,
		token,
	).Scan(&configFile)
	if err != nil {
		return "", err
	}

	return configFile, nil
}

// SaveAgentOutput saves the command related to a token
func SaveAgentOutput(orgID string, sessionToken string, command string, correctConfig string) error {
	_, err := DB.Exec(
		`INSERT INTO agent_output (org_id, session_token, command, correct_config) VALUES ($1, $2, $3, $4)`,
		orgID, sessionToken, command, correctConfig,
	)
	return err
}

// GetOrgIDByToken looks up the org_id associated with a config_credentials token
func GetOrgIDByToken(token string) (string, error) {
	var orgID string
	err := DB.QueryRow(
		`SELECT org_id FROM config_credentials WHERE token = $1`,
		token,
	).Scan(&orgID)
	return orgID, err
}

// GetAgentOutput gets the command for a token
func GetAgentOutput(sessionToken string) (string, string, error) {
	var command, correctConfig string
	err := DB.QueryRow(
		`SELECT command, correct_config FROM agent_output WHERE session_token = $1`,
		sessionToken,
	).Scan(&command, &correctConfig)

	if err != nil {
		return "", "", err
	}

	return command, correctConfig, nil
}

// GetLatestAgentOutput gets the most recent remediation command for a token
func GetLatestAgentOutput(sessionToken string) (string, string, error) {
	var command, correctConfig string
	err := DB.QueryRow(
		`SELECT command, COALESCE(correct_config, '') FROM agent_output WHERE session_token = $1 ORDER BY created_at DESC LIMIT 1`,
		sessionToken,
	).Scan(&command, &correctConfig)

	if err != nil {
		return "", "", err
	}

	return command, correctConfig, nil
}
