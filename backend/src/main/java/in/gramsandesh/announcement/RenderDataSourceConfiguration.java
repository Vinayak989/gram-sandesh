package in.gramsandesh.announcement;

import org.postgresql.ds.PGSimpleDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
@Profile("render")
public class RenderDataSourceConfiguration {
    @Bean
    DataSource renderDataSource(@Value("${DATABASE_URL}") String databaseUrl) {
        URI uri = URI.create(databaseUrl);
        String userInfo = uri.getUserInfo();
        int credentialSeparator = userInfo == null ? -1 : userInfo.indexOf(':');
        String databaseName = uri.getPath() == null ? "" : uri.getPath().replaceFirst("^/", "");

        if (uri.getHost() == null || uri.getPort() < 1 || credentialSeparator < 1
                || credentialSeparator == userInfo.length() - 1 || databaseName.isBlank()) {
            throw new IllegalStateException("The Render Postgres connection URL is incomplete.");
        }

        PGSimpleDataSource dataSource = new PGSimpleDataSource();
        dataSource.setServerNames(new String[]{uri.getHost()});
        dataSource.setPortNumbers(new int[]{uri.getPort()});
        dataSource.setDatabaseName(databaseName);
        dataSource.setUser(userInfo.substring(0, credentialSeparator));
        dataSource.setPassword(userInfo.substring(credentialSeparator + 1));
        dataSource.setApplicationName("gram-sandesh");
        return dataSource;
    }
}
