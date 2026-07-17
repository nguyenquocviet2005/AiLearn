from pathlib import Path

from ailearn_api.config import API_ENV_FILE, API_PROJECT_ROOT, Settings


def test_settings_parse_documented_comma_separated_cors_origins(monkeypatch) -> None:
    monkeypatch.setenv(
        "CORS_ORIGINS",
        "http://localhost:5173,https://preview.example.com",
    )

    settings = Settings(_env_file=None)

    assert settings.cors_origins == ["http://localhost:5173", "https://preview.example.com"]


def test_settings_default_dotenv_path_is_api_project_env_file() -> None:
    expected_api_root = Path(__file__).resolve().parents[1]

    assert expected_api_root == API_PROJECT_ROOT
    assert expected_api_root / ".env" == API_ENV_FILE
    assert Settings.model_config["env_file"] == API_ENV_FILE
