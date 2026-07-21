import os
import tempfile


def pytest_configure(config):
    workdir = tempfile.mkdtemp(prefix="rakshak_test_db_")
    os.chdir(workdir)
